export function loadCart() {
    const savedCart = localStorage.getItem('cart');

    if (!savedCart) {
        return [];
    }

    try {
        const parsed = JSON.parse(savedCart);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Failed to parse cart from storage:', error);
        return [];
    }
}