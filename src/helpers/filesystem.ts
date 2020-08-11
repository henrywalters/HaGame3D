interface IFilesystem {
    exists(path: string): Promise<boolean>;
    read(path: string): Promise<ReadableStream>;
    write(path: string, content: string): Promise<boolean>;
    delete(path: string): Promise<boolean>;
}

export class NetworkFilesystem implements IFilesystem {
    private root: string;

    constructor(root = "http://localhost") {
        this.root = root;
    }

    public async delete(path: string): Promise<boolean> {
        throw new Error("delete not implemented on network filesystem");
    }

    public async exists(path: string): Promise<boolean> {
        return new Promise((res, rej) => {
            fetch(this.root + "/" + path)
                .then(response => {
                    res(response.ok);
                });
        })
    }

    public async read(path: string): Promise<ReadableStream> {
        return new Promise((res, rej) => {
            fetch(this.root + "/" + path)
                .then(data => {
                    if (!data.ok) {
                        rej("Failed to read file");
                    }
                    res(data.body);
                });
        })
    }

    public async readText(path: string): Promise<string> {
        return new Promise((res, rej) => {
            fetch(this.root + "/" + path)
                .then((response) => {
                    response.text().then((text) => res(text));
                })
        })
    }

    public async write(path: string, content: string): Promise<boolean> {
        throw new Error("write not implemented on network filesystem");
    }


}