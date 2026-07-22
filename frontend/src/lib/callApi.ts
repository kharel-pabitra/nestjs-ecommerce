import type { AxiosResponse } from 'axios';
import { api, apiErrorMessage } from './api';
import type { ApiRouteDef } from '../data/routes';

export interface CallResult {
  ok: boolean;
  status: number | null;
  data: unknown;
  message?: string;
}

function buildUrl(
  route: ApiRouteDef,
  pathValues: Record<string, string>,
): string {
  let url = route.path;
  for (const param of route.pathParams ?? []) {
    url = url.replace(
      `:${param.name}`,
      encodeURIComponent(pathValues[param.name] ?? ''),
    );
  }
  return url;
}

/** Coerces raw form-state values into the correctly-typed body payload,
 * dropping empty optional fields so we don't send `""` for things the DTO
 * marks @IsOptional. */
function buildBody(
  route: ApiRouteDef,
  formValues: Record<string, unknown>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const field of route.bodyFields ?? []) {
    const raw = formValues[field.name];

    if (field.type === 'string-array') {
      const arr = Array.isArray(raw) ? raw.filter(Boolean) : [];
      if (arr.length > 0 || field.required) body[field.name] = arr;
      continue;
    }

    if (field.type === 'order-items') {
      const arr = Array.isArray(raw) ? raw : [];
      if (arr.length > 0 || field.required) body[field.name] = arr;
      continue;
    }

    if (raw === undefined || raw === null || raw === '') {
      continue; // omit empty optional fields entirely
    }

    if (field.type === 'number' || field.type === 'int') {
      body[field.name] = Number(raw);
    } else {
      body[field.name] = raw;
    }
  }
  return body;
}

export async function callRoute(
  route: ApiRouteDef,
  pathValues: Record<string, string>,
  formValues: Record<string, unknown>,
): Promise<CallResult> {
  const url = buildUrl(route, pathValues);
  const body = route.bodyFields ? buildBody(route, formValues) : undefined;
  console.log('CallRoute', route);

  try {
    let res: AxiosResponse;
    switch (route.method) {
      case 'GET':
        res = await api.get(url);
        break;
      case 'POST':
        res = await api.post(url, body);
        break;
      case 'PATCH':
        res = await api.patch(url, body);
        break;
      case 'DELETE':
        res = await api.delete(url);
        break;
    }
    return { ok: true, status: res.status, data: res.data };
  } catch (err) {
    console.log('error', err);
    const anyErr = err as { response?: { status: number; data: unknown } };
    return {
      ok: false,
      status: anyErr.response?.status ?? null,
      data: anyErr.response?.data ?? null,
      message: apiErrorMessage(err),
    };
  }
}
