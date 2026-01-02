import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ============================================================================
// TYPES
// ============================================================================

export type CartItem = {
  productId: string
  sku: string
  name: string
  price: number
  quantity: number
  maxQuantity?: number // Available stock
  imageUrl?: string
}

export type Cart = {
  id?: string // Server-side cart ID for logged-in users
  items: CartItem[]
  dealerId?: string
  updatedAt: Date
}

export type CartState = {
  cart: Cart
  isLoading: boolean
  isSyncing: boolean
  lastSyncedAt: Date | null
  error: string | null
}

export type CartActions = {
  // Item operations
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void

  // Cart management
  setCart: (cart: Cart) => void
  setDealerId: (dealerId: string) => void
  mergeCart: (serverCart: Cart) => void

  // Sync operations
  setSyncing: (isSyncing: boolean) => void
  setLastSyncedAt: (date: Date | null) => void
  setError: (error: string | null) => void
  setLoading: (isLoading: boolean) => void

  // Computed values
  getItemCount: () => number
  getSubtotal: () => number
  hasItem: (productId: string) => boolean
  getItem: (productId: string) => CartItem | undefined
}

export type CartStore = CartState & CartActions

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialCart: Cart = {
  items: [],
  updatedAt: new Date(),
}

const initialState: CartState = {
  cart: initialCart,
  isLoading: false,
  isSyncing: false,
  lastSyncedAt: null,
  error: null,
}

// ============================================================================
// STORE
// ============================================================================

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Item operations
      addItem: (item, quantity = 1) => {
        set((state) => {
          const existingIndex = state.cart.items.findIndex(
            (i) => i.productId === item.productId
          )

          let newItems: CartItem[]

          if (existingIndex >= 0) {
            // Update existing item quantity
            newItems = [...state.cart.items]
            const existing = newItems[existingIndex]
            const newQuantity = existing.quantity + quantity

            // Respect max quantity if set
            newItems[existingIndex] = {
              ...existing,
              quantity: existing.maxQuantity
                ? Math.min(newQuantity, existing.maxQuantity)
                : newQuantity,
            }
          } else {
            // Add new item
            const newItem: CartItem = {
              ...item,
              quantity: item.maxQuantity
                ? Math.min(quantity, item.maxQuantity)
                : quantity,
            }
            newItems = [...state.cart.items, newItem]
          }

          return {
            cart: {
              ...state.cart,
              items: newItems,
              updatedAt: new Date(),
            },
            error: null,
          }
        })
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            return {
              cart: {
                ...state.cart,
                items: state.cart.items.filter((i) => i.productId !== productId),
                updatedAt: new Date(),
              },
              error: null,
            }
          }

          const newItems = state.cart.items.map((item) => {
            if (item.productId !== productId) return item

            return {
              ...item,
              quantity: item.maxQuantity
                ? Math.min(quantity, item.maxQuantity)
                : quantity,
            }
          })

          return {
            cart: {
              ...state.cart,
              items: newItems,
              updatedAt: new Date(),
            },
            error: null,
          }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          cart: {
            ...state.cart,
            items: state.cart.items.filter((i) => i.productId !== productId),
            updatedAt: new Date(),
          },
          error: null,
        }))
      },

      clearCart: () => {
        set({
          cart: {
            ...initialCart,
            updatedAt: new Date(),
          },
          error: null,
        })
      },

      // Cart management
      setCart: (cart) => {
        set({ cart, error: null })
      },

      setDealerId: (dealerId) => {
        set((state) => ({
          cart: {
            ...state.cart,
            dealerId,
          },
        }))
      },

      mergeCart: (serverCart) => {
        set((state) => {
          // Merge strategy: combine local and server items
          // If same product exists in both, use the one with higher quantity
          const mergedItems = [...serverCart.items]

          for (const localItem of state.cart.items) {
            const existingIndex = mergedItems.findIndex(
              (i) => i.productId === localItem.productId
            )

            if (existingIndex >= 0) {
              // Use higher quantity
              if (localItem.quantity > mergedItems[existingIndex].quantity) {
                mergedItems[existingIndex] = localItem
              }
            } else {
              // Add local item
              mergedItems.push(localItem)
            }
          }

          return {
            cart: {
              ...serverCart,
              items: mergedItems,
              updatedAt: new Date(),
            },
            error: null,
          }
        })
      },

      // Sync operations
      setSyncing: (isSyncing) => set({ isSyncing }),
      setLastSyncedAt: (date) => set({ lastSyncedAt: date }),
      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading }),

      // Computed values
      getItemCount: () => {
        return get().cart.items.reduce((sum, item) => sum + item.quantity, 0)
      },

      getSubtotal: () => {
        return get().cart.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )
      },

      hasItem: (productId) => {
        return get().cart.items.some((i) => i.productId === productId)
      },

      getItem: (productId) => {
        return get().cart.items.find((i) => i.productId === productId)
      },
    }),
    {
      name: 'thor-dealer-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
)

// ============================================================================
// SELECTORS
// ============================================================================

export const selectCartItems = (state: CartStore) => state.cart.items
export const selectItemCount = (state: CartStore) => state.getItemCount()
export const selectSubtotal = (state: CartStore) => state.getSubtotal()
export const selectIsLoading = (state: CartStore) => state.isLoading
export const selectIsSyncing = (state: CartStore) => state.isSyncing
export const selectError = (state: CartStore) => state.error

// ============================================================================
// HOOKS FOR COMMON OPERATIONS
// ============================================================================

export function useCartItem(productId: string) {
  return useCartStore((state) => state.getItem(productId))
}

export function useIsInCart(productId: string) {
  return useCartStore((state) => state.hasItem(productId))
}

export function useCartItemCount() {
  return useCartStore((state) => state.getItemCount())
}

export function useCartSubtotal() {
  return useCartStore((state) => state.getSubtotal())
}
