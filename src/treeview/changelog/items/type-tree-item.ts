import * as vscode from 'vscode';
import { ItemType } from '../../../types/changelog';
import { getIconFromItemType, getTextFromItemType } from '../../util';

export class ChangelogTypeTreeItem extends vscode.TreeItem {
	contextValue?: string | undefined = 'changelog-type';

	constructor(public type: ItemType, public items: string[]) {
		super(getTextFromItemType(type), vscode.TreeItemCollapsibleState.Collapsed);
		if (items.length > 0) {
			this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
		}
		this.tooltip = new vscode.MarkdownString(items.map((x) => `- ${x}`).join('\n'));
		this.description = `(${items.length})`;
		this.iconPath = getIconFromItemType(type);
	}
}
