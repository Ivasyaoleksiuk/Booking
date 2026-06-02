<?php

use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('description');
            $table->integer('duration')->comment('in minutes');
            $table->decimal('price');
            $table->string('image');
            $table->timestamps();
        });

        Schema::create('master_service', function (Blueprint $table) {
            $table->id();
            $table
                ->foreignIdFor(User::class, 'master_id')
                ->constrained()
                ->cascadeOnDelete();
            $table
                ->foreignIdFor(Service::class, 'service_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
        Schema::dropIfExists('services_user');
    }
};
