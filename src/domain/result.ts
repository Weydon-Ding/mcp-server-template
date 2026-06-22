export type JsonSuccess<TData> = {
  ok: true;
  data: TData;
};

export type JsonFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export type JsonResult<TData> = JsonSuccess<TData> | JsonFailure;
