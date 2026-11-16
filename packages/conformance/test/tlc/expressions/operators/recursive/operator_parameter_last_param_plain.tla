(*---
description: "A RECURSIVE declaration has only plain _ slots, but SANY checks only the arity of the last parameter of the definition, so an operator parameter in an earlier position is accepted and works. The loop in Generator overwrites paramsMatch on each round."
ref: "tla2sany/semantic/Generator.java#processOperator"
features: [tlc-bug]
flags: [expression]
outcome: success
correct:
  all:
    exit: 150
    transcript: |-
      | Semantic errors:
      | *** Errors: 1
      | line 20, col 1 to line 20, col 76 of module operator_parameter_last_param_plain
      | Definition of Map has different arity than its RECURSIVE declaration.
      3002:1 Parsing or semantic analysis failed.
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
