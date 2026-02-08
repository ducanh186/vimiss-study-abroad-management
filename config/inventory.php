<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Warranty Expiry Threshold (Days)
    |--------------------------------------------------------------------------
    |
    | Number of days before warranty expiry to consider an asset as
    | "warranty expiring soon". Used for alerts and filtering.
    |
    */
    'warranty_expiry_threshold_days' => env('WARRANTY_EXPIRY_THRESHOLD_DAYS', 30),
];
