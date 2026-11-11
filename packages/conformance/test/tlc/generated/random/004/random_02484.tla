(*---
description: Evaluates a random record expression, seed 262, number 2484.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02484 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF ((\A b3906 \in {} : FALSE) /\ ({x \in 1..3 : x > 1} \subseteq {x \in 1..3 : x > 1})) THEN ((\A b3907 \in {x \in 1..3 : x > 1} : FALSE) => (<<1, 2>> = <<5, 6>>)) ELSE Head([<<>> EXCEPT ![1] = [a |-> 1, b |-> TRUE]]), b |-> ((({1, 2} \subseteq SUBSET {1}) /\ (\E b3908 \in 2..1 : FALSE)) /\ ((3 * -1) = (CHOOSE b3909 \in {1} : FALSE)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 319 to line 14, col 319 of module random_02484 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 317.
    | Expression starting at line 14, column 317.
    | ExtendableExpr starting at line 14, column 316.
    | Expression starting at line 14, column 316.
    | ExtendableExpr starting at line 14, column 315.
    | Fatal errors while parsing TLA+ spec in file random_02484
    | In module random_02484
    | Could not parse module random_02484 from file random_02484.tla
    | *** Errors: 1
    | In module random_02484
    | Could not parse module random_02484 from file random_02484.tla
    3002:1 Parsing or semantic analysis failed.
---*)
