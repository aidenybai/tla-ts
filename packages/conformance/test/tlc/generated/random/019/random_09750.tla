(*---
description: Evaluates a random record expression, seed 262, number 9750.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09750 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = (IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN (-{1}) ELSE Cardinality(1..3) \div ((-1 * -1) % (0 - <<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 156 to line 14, col 156 of module random_09750 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 154.
    | Expression starting at line 14, column 153.
    | ExtendableExpr starting at line 14, column 152.
    | Expression starting at line 14, column 152.
    | ExtendableExpr starting at line 14, column 151.
    | Fatal errors while parsing TLA+ spec in file random_09750
    | In module random_09750
    | Could not parse module random_09750 from file random_09750.tla
    | *** Errors: 1
    | In module random_09750
    | Could not parse module random_09750 from file random_09750.tla
    3002:1 Parsing or semantic analysis failed.
---*)
