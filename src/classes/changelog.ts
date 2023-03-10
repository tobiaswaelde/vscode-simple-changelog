import { itemTypes } from './../util/changelog';
import { ChangelogItem, ItemType, LineType, ChangelogVersion } from './../types/changelog';
import * as fs from 'fs';
import { findKey } from '../util/object';
import { getConfig } from '../config';

export class Changelog {
	public versions: ChangelogVersion[] = [];

	constructor(public readonly filepath: string) {
		if (filepath && filepath !== '') {
			this.readFromFile();
		}
	}

	public readFromFile(): boolean {
		if (!this.filepath || this.filepath === '') {
			return false;
		}

		const content = fs.readFileSync(this.filepath).toString();
		const changelog = Changelog.parse(content);
		this.versions = changelog.versions;
		return true;
	}
	public writeToFile(): boolean {
		if (!this.filepath) {
			return false;
		}

		fs.writeFileSync(this.filepath, this.toString());
		return true;
	}

	public static parse(data: string): Changelog {
		const changelog = new Changelog('');

		const lines = data.split('\n').map((x) => x.trim());

		let lineType: LineType = 'none';
		let itemType: ItemType | undefined = undefined; // = 'none';

		for (const line of lines) {
			lineType = this.parseLineType(line);

			if (lineType === 'version') {
				const v = this.parseVersion(line);
				if (v) {
					changelog.versions.push(v);
				}
			} else if (lineType === 'type') {
				itemType = this.parseItemType(line);
			} else if (lineType === 'item' && itemType) {
				const text = line.substring(1).trim();
				const item: ChangelogItem = { type: itemType, text };
				changelog.versions[changelog.versions.length - 1].items.push(item);
			}
		}

		return changelog;
	}
	public toString() {
		const attributionPosition = getConfig<'top' | 'bottom'>('attribution.placement') ?? 'top';
		const attribution = this.getAttribution();

		let x = '# Changelog\n\n';

		if (attributionPosition === 'top' && attribution) {
			x += `${attribution}\n\n`;
		}

		x += this.versions.map((v) => Changelog.stringifyVersion(v)).join('\n\n\n');

		if (attributionPosition === 'bottom' && attribution) {
			x += `\n\n${attribution}`;
		}

		return x.trim();
	}

	private static parseLineType(line: string): LineType {
		if (line.startsWith('## ')) {
			return 'version';
		}
		if ((line.startsWith('**') && line.endsWith('**')) || line.startsWith('### ')) {
			return 'type';
		}
		if (line.startsWith('- ')) {
			return 'item';
		}
		return 'none';
	}
	private static parseVersion(line: string): ChangelogVersion | undefined {
		const match = line.match(/## \[(?<version>.+)](\s*\-\s*(?<date>\d{4}-\d{2}-\d{2}))?/);
		if (match && match.groups) {
			const { version, date } = match.groups;
			return {
				label: version,
				date: date,
				items: [],
			};
		}
	}
	private static parseItemType(line: string): ItemType | undefined {
		const type = line.replace(/\*\*/g, '').replace(/\#{3}/g, '').trim();
		const key = findKey(itemTypes, 'header', type);
		return key;
	}
	private static stringifyItemType(itemType: ItemType): string {
		return itemTypes[itemType].header;
	}
	private static stringifyVersion(version: ChangelogVersion): string {
		let res = `## [${version.label}]`;
		if (version.date) {
			res += ` - ${version.date}`;
		}
		res += '\n';

		const items = [
			this.stringifyItems(version, 'addition'),
			this.stringifyItems(version, 'change'),
			this.stringifyItems(version, 'deprecation'),
			this.stringifyItems(version, 'fix'),
			this.stringifyItems(version, 'removal'),
			this.stringifyItems(version, 'securityChange'),
		].filter((x): x is string => !!x);

		res += items.join('\n\n');
		return res.trim();
	}
	private static stringifyItems(version: ChangelogVersion, itemType: ItemType): string {
		const items = version.items.filter((x) => x.type === itemType);
		if (items.length === 0) {
			return '';
		}

		let res = `### ${Changelog.stringifyItemType(itemType)}\n`;
		res += items.map((x) => `- ${x.text}`).join('\n');
		return res.trim();
	}
	private getAttribution(): string | undefined {
		const type = getConfig<'visible' | 'hidden' | 'none'>('attribution.visibility') ?? 'visible';
		const text = `Changelog created using the [Simple Changelog](https://marketplace.visualstudio.com/items?itemName=tobiaswaelde.vscode-simple-changelog) extension for VS Code.`;

		switch (type) {
			case 'visible':
				return `*${text}*`;
			case 'hidden':
				return `<!-- ${text} -->`;
			case 'none':
				return undefined;
		}
	}
}
