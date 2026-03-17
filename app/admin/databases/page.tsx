import { getDatabasesHealth } from '@/app/actions/databases'
import DatabasesClient from './databases-client'

export default async function DatabasesPage() {
  const data = await getDatabasesHealth()
  return <DatabasesClient initial={data as any} />
}

