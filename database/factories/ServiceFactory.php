<?php

namespace Database\Factories;

use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Service>
 */
class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->words(2, true),
            'description' => $this->faker->sentence(12),
            'duration' => $this->faker->randomElement([30, 45, 60, 90]),
            'price' => $this->faker->randomFloat(2, 10, 200),
            'image' => 'https://picsum.photos/seed/' . $this->faker->uuid . '/600/400',
        ];
    }
}
