import { ChangelogItem } from './../../../types/changelog';
import * as vscode from 'vscode';
import { Changelog } from '../../../classes/changelog';
import { ItemType, ChangelogVersion } from '../../../types/changelog';
import { getIconFromItemType } from '../../util';
import { itemTypes } from '../../../util/changelog';
import { getConfig } from '../../../config';

export class ChangelogTypeTreeItem extends vscode.TreeItem {
	contextValue = 'changelog-type';

	constructor(
		public changelog: Changelog,
		public version: ChangelogVersion,
		public type: ItemType,
		public items: ChangelogItem[]
	) {
		super(itemTypes[type].plural, vscode.TreeItemCollapsibleState.Collapsed);

		if (items.length > 0 && getConfig<boolean>('groupsOpenByDefault')) {
			this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
		}

		this.tooltip = new vscode.MarkdownString(items.map((x) => `- ${x}`).join('\n'));
		this.description = `(${items.length})`;
		this.iconPath = getIconFromItemType(type);
	}
}
