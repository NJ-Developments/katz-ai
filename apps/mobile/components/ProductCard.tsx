import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Product {
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  weight: string | null;
  requiresDrilling: boolean;
  reason: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: () => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="cube-outline" size={32} color="#9ca3af" />
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.sku}>SKU: {product.sku}</Text>
          <View style={styles.badges}>
            {product.requiresDrilling && (
              <View style={styles.badgeDrill}>
                <Ionicons name="construct-outline" size={12} color="#f59e0b" />
                <Text style={styles.badgeDrillText}>Drilling Required</Text>
              </View>
            )}
            {product.stock <= 5 && (
              <View style={styles.badgeLowStock}>
                <Text style={styles.badgeLowStockText}>Low Stock</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {product.description}
      </Text>

      {product.reason && (
        <View style={styles.reasonContainer}>
          <Ionicons name="sparkles" size={14} color="#2563eb" />
          <Text style={styles.reasonText}>{product.reason}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.weight && (
            <Text style={styles.weight}>Holds up to {product.weight}</Text>
          )}
          <Text style={styles.stock}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </Text>
        </View>

        <Pressable
          style={[
            styles.addButton,
            product.stock === 0 && styles.addButtonDisabled,
          ]}
          onPress={onAddToCart}
          disabled={product.stock === 0}
        >
          <Ionicons name="cart" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sku: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeDrill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    gap: 4,
  },
  badgeDrillText: {
    fontSize: 10,
    color: '#b45309',
    fontWeight: '500',
  },
  badgeLowStock: {
    backgroundColor: '#fee2e2',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  badgeLowStockText: {
    fontSize: 10,
    color: '#dc2626',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  weight: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  stock: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  addButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
