----------------------------- MODULE StringSet -----------------------------
\* TLC has no Strings module. Its Java class tlc2.module.Strings implements the
\* built-in set STRING, which equals only itself.
EXTENDS Naturals, Integers, Sequences, FiniteSets, TLCExt

CONSTANT M

ASSUME "a" \in STRING
ASSUME M \notin STRING
ASSUME ~IsFiniteSet(STRING)
ASSUME STRING = STRING
ASSUME STRING # M
ASSUME <<STRING>> = <<STRING>>
ASSUME [STRING -> {1}] = [STRING -> {1}]
ASSUME STRING \in {STRING, M}

\* Comparing STRING with any other set is an error, worded by the class of the
\* left operand.
ASSUME AssertError(
           "Attempted to compare STRING with the value\nNat",
           STRING = Nat)
ASSUME AssertError(
           "Attempted to compare STRING with the value\nSeq({\"a\"})",
           STRING = Seq({"a"}))
ASSUME AssertError(
           "Attempted to compare overridden value STRING with non-overridden value:\n{}",
           STRING = {})
ASSUME AssertError(
           "Attempted to compare overridden value STRING with non-overridden value:\n1..2",
           STRING = 1..2)
ASSUME AssertError(
           "Attempted to compare Int with the value\nSTRING",
           Int = STRING)
ASSUME AssertError(
           "Attempted to check equality of the set {1, 2} with the value:\nSTRING",
           1..2 = STRING)
ASSUME AssertError(
           "Attempted to check equality of the set {\"a\"} with the value:\nSTRING",
           {"a"} # STRING)

\* A function set compares its own domain with the domain of the function.
ASSUME AssertError(
           "Attempted to compare overridden value STRING with non-overridden value:\n{\"x\"}",
           [s \in {"x"} |-> 1] \in [STRING -> {1}])
=============================================================================
