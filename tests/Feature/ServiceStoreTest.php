<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceStoreTest extends TestCase
{
    use RefreshDatabase;

    private function adminUser(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_guests_cannot_create_a_service(): void
    {
        $response = $this->post(route('services_store'), [
            'title'    => 'Haircut',
            'duration' => 30,
            'price'    => 25.00,
        ]);

        $response->assertRedirect(route('login'));
    }

    public function test_admin_can_create_a_service(): void
    {
        $this->actingAs($this->adminUser());

        $response = $this->post(route('services_store'), [
            'title'       => 'Haircut',
            'description' => 'A classic haircut.',
            'duration'    => 30,
            'price'       => 25.00,
        ]);

        $response->assertRedirect(route('services_index'));
        $this->assertDatabaseHas('services', [
            'title'    => 'Haircut',
            'duration' => 30,
        ]);
    }

    public function test_admin_can_create_service_without_description(): void
    {
        $this->actingAs($this->adminUser());

        $response = $this->post(route('services_store'), [
            'title'    => 'Manicure',
            'duration' => 45,
            'price'    => 15.00,
        ]);

        $response->assertRedirect(route('services_index'));
        $this->assertDatabaseHas('services', ['title' => 'Manicure']);
    }

    public function test_store_validates_required_fields(): void
    {
        $this->actingAs($this->adminUser());

        $response = $this->post(route('services_store'), []);

        $response->assertSessionHasErrors(['title', 'duration', 'price']);
    }

    public function test_store_validates_duration_is_positive_integer(): void
    {
        $this->actingAs($this->adminUser());

        $response = $this->post(route('services_store'), [
            'title'    => 'Test',
            'duration' => 0,
            'price'    => 10,
        ]);

        $response->assertSessionHasErrors(['duration']);
    }

    public function test_store_validates_price_is_non_negative(): void
    {
        $this->actingAs($this->adminUser());

        $response = $this->post(route('services_store'), [
            'title'    => 'Test',
            'duration' => 30,
            'price'    => -1,
        ]);

        $response->assertSessionHasErrors(['price']);
    }
}