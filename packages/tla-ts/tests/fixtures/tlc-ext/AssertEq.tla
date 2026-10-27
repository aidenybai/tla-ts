------------------------------ MODULE AssertEq ------------------------------
EXTENDS Naturals, TLCExt

VARIABLE x

Init == x = 0

Next == x < 2 /\ x' = x + 1

\* AssertEq prints the string "Assertion failed" and both values when they
\* differ, as its TLA+ definition does with PrintT.
Same == AssertEq(x, 0) \/ x > 0

\* ToTrace accepts only a counterexample.
ASSUME AssertError(
           "The argument of ToTrace should be a CounterExample, but instead it is:\n42",
           ToTrace(42))
=============================================================================
