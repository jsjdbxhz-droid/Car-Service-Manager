import { z as zod } from "zod";

// ── Health ────────────────────────────────────────────────────────────────────

export const HealthCheckResponse = zod.object({
  status: zod.string(),
});

// ── Auth ─────────────────────────────────────────────────────────────────────

export const RegisterBody = zod.object({
  username: zod.string(),
  loginCode: zod.string(),
  deviceId: zod.string().optional(),
});

export const RegisterResponse = zod.object({
  token: zod.string(),
  user: zod.object({
    id: zod.number(),
    username: zod.string(),
    loginCode: zod.string(),
    role: zod.string(),
    deviceId: zod.string().nullish(),
    createdAt: zod.string(),
  }),
});

export const LoginBody = zod.object({
  loginCode: zod.string(),
});

export const LoginResponse = zod.object({
  token: zod.string(),
  user: zod.object({
    id: zod.number(),
    username: zod.string(),
    loginCode: zod.string(),
    role: zod.string(),
    deviceId: zod.string().nullish(),
    createdAt: zod.string(),
  }),
});

export const MeResponse = zod.object({
  id: zod.number(),
  username: zod.string(),
  loginCode: zod.string(),
  role: zod.string(),
  deviceId: zod.string().nullish(),
  createdAt: zod.string(),
});

// ── Records ───────────────────────────────────────────────────────────────────

const RecordShape = {
  id: zod.number(),
  userId: zod.number(),
  username: zod.string(),
  firstName: zod.string(),
  lastName: zod.string(),
  breakdownType: zod.string(),
  repairDescription: zod.string().nullish(),
  totalAmount: zod.number(),
  customerNumber: zod.string().nullish(),
  carType: zod.string(),
  licensePlate: zod.string(),
  paymentStatus: zod.string(),
  entryDate: zod.string(),
  visitCount: zod.number().optional(),
  createdAt: zod.string(),
};

/**
 * @summary List records with optional search
 */
export const ListRecordsQueryParams = zod.object({
  "search": zod.coerce.string().optional(),
  "deviceId": zod.coerce.string().optional()
})

export const ListRecordsResponseItem = zod.object(RecordShape)
export const ListRecordsResponse = zod.array(ListRecordsResponseItem)


/**
 * @summary Create a record
 */
export const CreateRecordBody = zod.object({
  "firstName": zod.string(),
  "lastName": zod.string(),
  "breakdownType": zod.string(),
  "repairDescription": zod.string().optional(),
  "totalAmount": zod.number(),
  "customerNumber": zod.string().optional(),
  "carType": zod.string(),
  "licensePlate": zod.string(),
  "paymentStatus": zod.string().optional(),
  "entryDate": zod.string().optional(),
})

export const CreateRecordResponse = zod.object(RecordShape)


/**
 * @summary Get a record
 */
export const GetRecordParams = zod.object({
  "id": zod.coerce.number()
})

export const GetRecordResponse = zod.object(RecordShape)


/**
 * @summary Update a record
 */
export const UpdateRecordParams = zod.object({
  "id": zod.coerce.number()
})

export const UpdateRecordBody = zod.object({
  "firstName": zod.string().optional(),
  "lastName": zod.string().optional(),
  "breakdownType": zod.string().optional(),
  "repairDescription": zod.string().optional(),
  "totalAmount": zod.number().optional(),
  "customerNumber": zod.string().optional(),
  "carType": zod.string().optional(),
  "licensePlate": zod.string().optional(),
  "paymentStatus": zod.string().optional(),
  "entryDate": zod.string().optional(),
})

export const UpdateRecordResponse = zod.object(RecordShape)


/**
 * @summary Delete a record
 */
export const DeleteRecordParams = zod.object({
  "id": zod.coerce.number()
})

export const DeleteRecordResponse = zod.void()


// ── Invoices ──────────────────────────────────────────────────────────────────

export const ListInvoicesQueryParams = zod.object({
  "search": zod.coerce.string().optional()
})

export const ListInvoicesResponseItem = zod.object({
  "id": zod.number(),
  "userId": zod.number(),
  "username": zod.string(),
  "firstName": zod.string(),
  "lastName": zod.string(),
  "workshopName": zod.string(),
  "amount": zod.number(),
  "paymentMethod": zod.string(),
  "carType": zod.string(),
  "licensePlate": zod.string(),
  "breakdownType": zod.string(),
  "date": zod.string(),
  "createdAt": zod.string()
})
export const ListInvoicesResponse = zod.array(ListInvoicesResponseItem)

export const CreateInvoiceBody = zod.object({
  "firstName": zod.string(),
  "lastName": zod.string(),
  "workshopName": zod.string(),
  "amount": zod.number(),
  "paymentMethod": zod.string(),
  "carType": zod.string(),
  "licensePlate": zod.string(),
  "breakdownType": zod.string(),
  "date": zod.string().optional(),
})

export const CreateInvoiceResponse = zod.object({
  "id": zod.number(),
  "userId": zod.number(),
  "username": zod.string(),
  "firstName": zod.string(),
  "lastName": zod.string(),
  "workshopName": zod.string(),
  "amount": zod.number(),
  "paymentMethod": zod.string(),
  "carType": zod.string(),
  "licensePlate": zod.string(),
  "breakdownType": zod.string(),
  "date": zod.string(),
  "createdAt": zod.string()
})

export const GetInvoiceParams = zod.object({
  "id": zod.coerce.number()
})

export const GetInvoiceResponse = zod.object({
  "id": zod.number(),
  "userId": zod.number(),
  "username": zod.string(),
  "firstName": zod.string(),
  "lastName": zod.string(),
  "workshopName": zod.string(),
  "amount": zod.number(),
  "paymentMethod": zod.string(),
  "carType": zod.string(),
  "licensePlate": zod.string(),
  "breakdownType": zod.string(),
  "date": zod.string(),
  "createdAt": zod.string()
})

export const UpdateInvoiceParams = zod.object({
  "id": zod.coerce.number()
})

export const UpdateInvoiceBody = zod.object({
  "firstName": zod.string().optional(),
  "lastName": zod.string().optional(),
  "workshopName": zod.string().optional(),
  "amount": zod.number().optional(),
  "paymentMethod": zod.string().optional(),
  "carType": zod.string().optional(),
  "licensePlate": zod.string().optional(),
  "breakdownType": zod.string().optional(),
  "date": zod.string().optional(),
})

export const UpdateInvoiceResponse = zod.object({
  "id": zod.number(),
  "userId": zod.number(),
  "username": zod.string(),
  "firstName": zod.string(),
  "lastName": zod.string(),
  "workshopName": zod.string(),
  "amount": zod.number(),
  "paymentMethod": zod.string(),
  "carType": zod.string(),
  "licensePlate": zod.string(),
  "breakdownType": zod.string(),
  "date": zod.string(),
  "createdAt": zod.string()
})

export const DeleteInvoiceParams = zod.object({
  "id": zod.coerce.number()
})

export const DeleteInvoiceResponse = zod.void()


// ── Admin ─────────────────────────────────────────────────────────────────────

export const AdminListUsersResponseItem = zod.object({
  "id": zod.number(),
  "username": zod.string(),
  "loginCode": zod.string(),
  "role": zod.string(),
  "deviceId": zod.string().nullish(),
  "createdAt": zod.string(),
})
export const AdminListUsersResponse = zod.array(AdminListUsersResponseItem)

export const AdminGetUserRecordsParams = zod.object({
  "userId": zod.coerce.number()
})

export const AdminGetUserRecordsResponseItem = zod.object(RecordShape)
export const AdminGetUserRecordsResponse = zod.array(AdminGetUserRecordsResponseItem)

export const AdminGetUserInvoicesParams = zod.object({
  "userId": zod.coerce.number()
})

export const AdminGetUserInvoicesResponseItem = zod.object({
  "id": zod.number(),
  "userId": zod.number(),
  "username": zod.string(),
  "firstName": zod.string(),
  "lastName": zod.string(),
  "workshopName": zod.string(),
  "amount": zod.number(),
  "paymentMethod": zod.string(),
  "carType": zod.string(),
  "licensePlate": zod.string(),
  "breakdownType": zod.string(),
  "date": zod.string(),
  "createdAt": zod.string()
})
export const AdminGetUserInvoicesResponse = zod.array(AdminGetUserInvoicesResponseItem)


// ── Stats ─────────────────────────────────────────────────────────────────────

export const GetStatsResponse = zod.object({
  "totalRecords": zod.number(),
  "totalInvoices": zod.number(),
  "totalAmount": zod.number(),
  "recentRecords": zod.array(zod.object({
    "id": zod.number(),
    "firstName": zod.string(),
    "lastName": zod.string(),
    "carType": zod.string(),
    "licensePlate": zod.string(),
    "totalAmount": zod.number(),
    "createdAt": zod.string(),
  }))
})
