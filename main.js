const { Plugin, TFolder, TFile, Notice } = require('obsidian');

module.exports = class LLMExportPlugin extends Plugin {
    async onload() {
        // Register the context menu for folders
        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file) => {
                if (file instanceof TFolder) {
                    menu.addItem((item) => {
                        item
                            .setTitle("Export to LLM")
                            .setIcon("document-plus")
                            .onClick(async () => {
                                await this.exportFolderToLLM(file);
                            });
                    });
                }
            })
        );
    }

    async exportFolderToLLM(folder) {
        const files = [];
        
        // Recursive function to get all markdown files
        const getMarkdownFiles = (currentFolder) => {
            for (const child of currentFolder.children) {
                if (child instanceof TFile && child.extension === "md") {
                    files.push(child);
                } else if (child instanceof TFolder) {
                    getMarkdownFiles(child);
                }
            }
        };

        getMarkdownFiles(folder);

        if (files.length === 0) {
            new Notice("No markdown files found in this folder.");
            return;
        }

        let combinedContent = `--- \nLLM EXPORT: ${folder.name}\nGenerated: ${new Date().toLocaleString()}\n---\n\n`;

        for (const file of files) {
            const content = await this.app.vault.read(file);
            combinedContent += `### FILE: ${file.path}\n\n${content}\n\n---\n\n`;
        }

        // Ensure the LLM Output folder exists
        const outputFolderName = "LLM Output";
        let outputFolder = this.app.vault.getAbstractFileByPath(outputFolderName);
        
        if (!outputFolder) {
            await this.app.vault.createFolder(outputFolderName);
        }

        const fileName = `${folder.name} Output.md`;
        const filePath = `${outputFolderName}/${fileName}`;
        
        let existingFile = this.app.vault.getAbstractFileByPath(filePath);

        if (existingFile instanceof TFile) {
            await this.app.vault.modify(existingFile, combinedContent);
            new Notice(`Updated: ${fileName}`);
        } else {
            await this.app.vault.create(filePath, combinedContent);
            new Notice(`Created: ${fileName}`);
        }
    }
};
