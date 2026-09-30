Body/response items: `disposition_method`, `effective_datetime`, `id`. POST returns **201**.

**The accepted method list differs by endpoint.** These history endpoints accept only `HIFO`, `FIFO`, `LIFO`, `LOFO`. `POST /accounts` and `PATCH /accounts/{id}` additionally accept `AUSTRIA`. `SPECID` is neither — it is selected per transaction via `disposition_method: "SPECID"` together with `inventory_lots`.
