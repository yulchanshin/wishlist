import {create} from "zustand";
import axios from "axios";

const BASE_URL = "http://localhost:3000"

export const useProductStore = create ((set, get) => ({
    //products state
    products:[],
    loading:false,
    error:null,

    fetchProducts: async () => {
        set({loading:true});
        try {
            const response =await axios.get(`${BASE_URL}/api/products`)
            set({products: response.data.data, error: null});
        } catch (error) {
            if(error.status == 429) {
                set({error: "Too many requests", products: []})}
            else {set({error: "Something went wrong", products: []})}

        } finally {
            set({loading:false})
        }
    },

    deleteProduct: async (id) => {
        console.log("delete product fct called")
        set({loading:true});
        try {
            await axios.delete(`${BASE_URL}/api/products/${id}`);
            set(prev => ({products: prev.products.filter(product => product.id !== id)}))
        } catch (error) {
            console.log("Error deleting product", error);
            toast.error("Something went wrong")
        } finally {
            set({loading:false})
        }
    }
}))
