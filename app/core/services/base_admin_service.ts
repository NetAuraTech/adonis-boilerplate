import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { LucidModel } from '@adonisjs/lucid/types/model'

/**
 * T : The type of entity (the model)
 * Filters : The type of filters for the list
 * CreatePayload : The type of creation data
 * UpdatePayload : The type of update data
 * DetailResponse : The type of detail data
 */
export default abstract class BaseAdminService<
  T extends LucidModel,
  Filters = any,
  CreatePayload = any,
  UpdatePayload = any,
  DetailResponse = InstanceType<T>,
> {
  protected abstract model: T

  abstract list(filters: Filters): Promise<ModelPaginatorContract<InstanceType<T>>>

  abstract detail(id: number): Promise<DetailResponse>

  abstract create(payload: CreatePayload): Promise<InstanceType<T>>

  abstract update(id: number, payload: UpdatePayload): Promise<InstanceType<T>>

  abstract delete(id: number): Promise<void>
}
