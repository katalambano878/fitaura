<?php
/**
 * Promote fitaura-staging → production domains on Coolify.
 * Run inside coolify container via: php artisan tinker /var/www/html/promote-fitaura-prod.php
 */
use App\Models\Application;
use App\Models\EnvironmentVariable;

$app = Application::where('uuid', 's13ck4gvlrdleb1eyj4ebpth')->firstOrFail();
echo "before: {$app->name} fqdn={$app->fqdn}\n";

$app->name = 'fitaura-app';
$app->fqdn = 'https://shopfitaura.com,https://www.shopfitaura.com,https://fitaura-staging.169-58-8-203.sslip.io';
$app->save();

$url = 'https://shopfitaura.com';
foreach (['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'STORAGE_PUBLIC_URL'] as $k) {
    $rows = EnvironmentVariable::where('resourceable_id', $app->id)
        ->where('resourceable_type', get_class($app))
        ->where('key', $k)
        ->get();
    if ($rows->count() === 0) {
        $env = new EnvironmentVariable();
        $env->resourceable_id = $app->id;
        $env->resourceable_type = get_class($app);
        $env->key = $k;
        $env->value = $url;
        $env->is_preview = false;
        $env->is_buildtime = true;
        $env->is_runtime = true;
        $env->save();
        echo "created $k\n";
    } else {
        foreach ($rows as $env) {
            $env->value = $url;
            $env->is_buildtime = true;
            $env->is_runtime = true;
            $env->save();
        }
        echo "updated $k count=" . $rows->count() . "\n";
    }
}

$app->refresh();
$labels = generateLabelsApplication($app);
$customLabels = str(implode('|coolify|', $labels))->replace('|coolify|', "\n");
$app->custom_labels = base64_encode($customLabels);
$app->save();

echo "after: {$app->name} fqdn={$app->fqdn}\n";
echo "labels_hosts_preview:\n";
foreach ($labels as $label) {
    if (str_contains($label, 'Host(') || str_contains($label, 'rule=')) {
        echo $label . "\n";
    }
}
