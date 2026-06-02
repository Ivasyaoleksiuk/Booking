<?php

namespace App\Repositories;

use App\Models\Schedule;

class ScheduleRepository
{

    public function create($data)
    {
        return Schedule::query()->create($data);
    }

    public function update($data)
    {
        return Schedule::find($data['id'])->update($data);
    }

}