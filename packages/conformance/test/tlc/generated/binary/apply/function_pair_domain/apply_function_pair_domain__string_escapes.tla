(*---
description: apply of function_pair_domain, a FcnRcdValue, and string_escapes, a StringValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_pair_domain__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1}, y \in {2} |-> x + y])["a\"b\\c\n"])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_function_pair_domain__string_escapes failed.
    In applying the function
    (<<1, 2>> :> 3),
    the argument list is:
    "a\"b\\c\n"
    which does not match its formal parameter.
---*)
