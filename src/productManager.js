const fs = require('fs');

class ProductManager {
    constructor() {
        this.products = [];
        this.loadProductsFromFile();
    }

    loadProductsFromFile(filePath = 'productos.json') {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            this.products = JSON.parse(data);
            console.log(`Productos cargados desde el archivo ${filePath}:`, this.products); 
        } catch (err) {
            console.error('Error al cargar los productos desde el archivo:', err);
        }
    }

    addProduct(title, description, price, thumbnail, code, stock, status = true, category) {
        if (!title || !description || !price || !thumbnail || !code || !stock || category === undefined) {
            console.log("Todos los campos son obligatorios.");
            return;
        }

        if (this.products.some(product => product.code === code)) {
            console.log(`No puedes agregar código (${code}) porque ya existe.`);
            return;
        }

        const product = {
            id: this.getNextProductId(),
            title: title,
            description: description,
            price: price,
            thumbnail: thumbnail,
            code: code,
            stock: stock,
            status: status,
            category: category
        };
        this.products.push(product);

        console.log(`Se agregó el Producto con ID-${product.id} exitosamente.`);
        this.saveProductsToFile();
    }

    getNextProductId() {
        let nextId = 1;
        if (this.products.length > 0) {
            const maxId = Math.max(...this.products.map(product => product.id));
            nextId = maxId + 1;
        }
        return nextId;
    }


    findProductByCode(id) {
        return this.products.find(product => product.id === id);
    }

    getAllProducts() {
        const productsInfo = this.products.map(product => {
            return {
                id: product.id,
                title: product.title,
                description: product.description,
                price: product.price,
                thumbnail: product.thumbnail,
                code: product.code,
                stock: product.stock,
                status: status,
                category: category
            };
        });

        return productsInfo;
    }

    updateProduct(id, updatedFields) {
        const productToUpdate = this.products.find(product => product.id === id);
        if (!productToUpdate) {
            console.log(`No se encontró ningún producto con ID-${id}.`);
            return;
        }
    
        
        delete updatedFields.id;
    
        Object.assign(productToUpdate, updatedFields);
    
        this.saveProductsToFile();
    
        console.log(`Producto con ID-${id} actualizado exitosamente.`);
    }
    

    deleteProduct(id) {
        
        if (isNaN(id)) {
            console.log(`El ID proporcionado (${id}) no es válido.`);
            return;
        }
    
        const index = this.products.findIndex(product => product.id === id);
        if (index === -1) {
            console.log(`No se encontró ningún producto con ID-${id}.`);
            return;
        }
    
        this.products.splice(index, 1);
    
        this.saveProductsToFile();
    
        console.log(`Producto con ID-${id} eliminado exitosamente.`);
    }
    

    saveProductsToFile(filePath = 'productos.json') {
        const data = JSON.stringify(this.products, null, 2);
        fs.writeFileSync(filePath, data);
        console.log(`Productos guardados en el archivo ${filePath}.`);
    }
}

module.exports = ProductManager;


