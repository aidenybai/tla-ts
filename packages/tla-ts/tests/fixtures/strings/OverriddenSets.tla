--------------------------- MODULE OverriddenSets ---------------------------
\* TLC implements Nat, Int, STRING, and Seq(S) in Java classes. They compare
\* with each other and with model values, but comparing one with any other set
\* is an error, worded by the class of the left operand.
EXTENDS Naturals, Integers, Sequences, TLCExt

CONSTANT M

ASSUME Nat # Int
ASSUME Int # Nat
ASSUME Nat # M
ASSUME {Nat, Int} = {Int, Nat}
ASSUME Nat \notin {M}

ASSUME AssertError(
           "Attempted to compare overridden value Nat with non-overridden value:\n{}",
           Nat = {})
ASSUME AssertError(
           "Attempted to check equality of the set {} with the value:\nNat",
           {} = Nat)
ASSUME AssertError(
           "Attempted to compare overridden value Int with non-overridden value:\n1..2",
           Int = 1..2)
ASSUME AssertError(
           "Attempted to compare Nat with the value\nSeq({1})",
           Nat = Seq({1}))
ASSUME AssertError(
           "Attempted to compare Seq({1}) with the value\nNat",
           Seq({1}) = Nat)
ASSUME AssertError(
           "Attempted to compare overridden value Seq({1}) with non-overridden value:\n{}",
           Seq({1}) = {})

\* Membership in an enumerated set compares each element with the value.
ASSUME AssertError(
           "Attempted to compare overridden value Nat with non-overridden value:\n{}",
           {} \in {Nat})
ASSUME AssertError(
           "Attempted to compare overridden value STRING with non-overridden value:\n{}",
           {} \in {STRING})
=============================================================================
