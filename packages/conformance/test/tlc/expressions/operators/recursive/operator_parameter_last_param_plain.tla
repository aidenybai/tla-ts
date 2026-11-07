(*---
description: "A RECURSIVE declaration has only plain _ slots, but SANY checks only the arity of the last parameter of the definition, so an operator parameter in an earlier position is accepted and works. The loop in Generator overwrites paramsMatch on each round."
ref: "tla2sany/semantic/Generator.java#processOperator"
features: [tlc-bug]
flags: [expression]
outcome: success
---*)
---- MODULE operator_parameter_last_param_plain ----
EXTENDS Integers, Sequences
RECURSIVE Map(_, _)
Map(f(_), s) == IF s = <<>> THEN <<>> ELSE <<f(Head(s))>> \o Map(f, Tail(s))
Test == Map(LAMBDA x : x + 1, <<1, 2>>) = <<2, 3>>
====

(*--- recorded
all:
  exit: 0
---*)
