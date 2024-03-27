class ProductManager {
    constructor() {
        this.products = [];
        this.productIdCounter = 1;
    }


    addProduct(title, description, price, thumbnail, code, stock) {

        if (!title || !description || !price || !thumbnail || !code || !stock) {
            console.log("Todos los campos son obligatorios.");
            return;
        }


        if (this.products.some(product => product.code === code)) {
            console.log(`No puedes agregar código (${code}) porque  ya existe.`);
            return;
        }

        const product = {
            id: this.productIdCounter++,
            title: title,
            description: description,
            price: price,
            thumbnail: thumbnail,
            code: code,
            stock: stock
        };
        this.products.push(product);


        console.log(`Se agrago el Producto con  ID-${product.id} exitosamente `);
    }


    findProductByCode(code) {
        return this.products.find(product => product.code === code);
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
                stock: product.stock
            };
        });
    
        return productsInfo;
    }
}

// testeamos el Funcionamiento 
const productManager = new ProductManager();

console.log("Primeras acciones: \n");
productManager.addProduct("Producto 1", "Descripción del producto 1", 10.99, "thumbnail1.jpg", "001", 100);
productManager.addProduct("Producto 2", "Descripción del producto 2", 20.49, "thumbnail2.jpg", "002", 50);

console.log("\n");
console.log("Viendo resultados al intentar agregar un articulo con ID existente:");
productManager.addProduct("Producto 3", "Descripción del producto 3", 30.99, "thumbnail3.jpg", "001", 200);

console.log("\n");
console.log("Viendo resultados al intentar agregar un articulo sin campos obligatorios:");
productManager.addProduct("Producto 4", "", 40.99, "thumbnail4.jpg", "004", 300);

console.log("\n");
console.log("Se muestran todos los articulos:");
const allProducts = productManager.getAllProducts();
console.log(allProducts);


console.log("\n");
console.log("Se muestra el resultado de la busqueda por code:");

const productFound = productManager.findProductByCode('002');
if (productFound) {
    console.log("Producto encontrado:", productFound);
} else {
    console.log("No se encontró ningún producto con ese código.");
}