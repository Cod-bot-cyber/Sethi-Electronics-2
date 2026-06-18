import { ListAllProductsData, GetUserOrdersData, AddToCartData, AddToCartVariables, UpdateProductStockData, UpdateProductStockVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useListAllProducts(options?: useDataConnectQueryOptions<ListAllProductsData>): UseDataConnectQueryResult<ListAllProductsData, undefined>;
export function useListAllProducts(dc: DataConnect, options?: useDataConnectQueryOptions<ListAllProductsData>): UseDataConnectQueryResult<ListAllProductsData, undefined>;

export function useGetUserOrders(options?: useDataConnectQueryOptions<GetUserOrdersData>): UseDataConnectQueryResult<GetUserOrdersData, undefined>;
export function useGetUserOrders(dc: DataConnect, options?: useDataConnectQueryOptions<GetUserOrdersData>): UseDataConnectQueryResult<GetUserOrdersData, undefined>;

export function useAddToCart(options?: useDataConnectMutationOptions<AddToCartData, FirebaseError, AddToCartVariables>): UseDataConnectMutationResult<AddToCartData, AddToCartVariables>;
export function useAddToCart(dc: DataConnect, options?: useDataConnectMutationOptions<AddToCartData, FirebaseError, AddToCartVariables>): UseDataConnectMutationResult<AddToCartData, AddToCartVariables>;

export function useUpdateProductStock(options?: useDataConnectMutationOptions<UpdateProductStockData, FirebaseError, UpdateProductStockVariables>): UseDataConnectMutationResult<UpdateProductStockData, UpdateProductStockVariables>;
export function useUpdateProductStock(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateProductStockData, FirebaseError, UpdateProductStockVariables>): UseDataConnectMutationResult<UpdateProductStockData, UpdateProductStockVariables>;
