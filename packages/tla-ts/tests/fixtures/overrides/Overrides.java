import tlc2.value.impl.BoolValue;
import tlc2.value.impl.IntValue;
import tlc2.value.impl.StringValue;
import tlc2.value.impl.Value;

// Compiled with javac --release 8 -cp tla2tools.jar Overrides.java
public class Overrides {
    public static Value Flag() {
        return BoolValue.ValTrue;
    }

    public static Value Small() {
        return IntValue.gen(3);
    }

    public static Value Large() {
        return IntValue.gen(100000);
    }

    public static Value Name() {
        return new StringValue("java");
    }

    public static Value Twice(Value value) {
        return IntValue.gen(-2);
    }

    public static Value Mismatch(Value value) {
        return BoolValue.ValFalse;
    }

    public static Value Computed() {
        return IntValue.gen(Integer.parseInt("7"));
    }
}
