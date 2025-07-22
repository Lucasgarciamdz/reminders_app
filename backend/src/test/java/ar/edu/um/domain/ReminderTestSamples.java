package ar.edu.um.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class ReminderTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static Reminder getReminderSample1() {
        return new Reminder().id(1L).title("title1").description("description1");
    }

    public static Reminder getReminderSample2() {
        return new Reminder().id(2L).title("title2").description("description2");
    }

    public static Reminder getReminderRandomSampleGenerator() {
        return new Reminder().id(longCount.incrementAndGet()).title(UUID.randomUUID().toString()).description(UUID.randomUUID().toString());
    }
}
