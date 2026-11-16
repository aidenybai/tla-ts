(*---
description: Evaluates a random function expression, seed 262, number 5320.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05320 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE) @@ [[(<<5, 6>> @@ [x \in 1..2 |-> x]) EXCEPT ![(3 + 3)] = (CHOOSE b8227 \in {x \in 1..3 : x > 1} : TRUE)] EXCEPT ![LET b8228 == (3 \div -1) IN Len(<<1>>)] = Cardinality({0, 1})]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 191 to line 14, col 194 of module random_05320 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 189.
    | Expression starting at line 14, column 189.
    | ExtendableExpr starting at line 14, column 188.
    | Expression starting at line 14, column 188.
    | Definition starting at line 14, column 179.
    | Fatal errors while parsing TLA+ spec in file random_05320
    | In module random_05320
    | Could not parse module random_05320 from file random_05320.tla
    | *** Errors: 1
    | In module random_05320
    | Could not parse module random_05320 from file random_05320.tla
    3002:1 Parsing or semantic analysis failed.
---*)
