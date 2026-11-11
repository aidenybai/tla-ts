(*---
description: Evaluates a random function expression, seed 262, number 5018.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05018 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (IF FALSE THEN -1 ELSE 3 * ([a |-> 1]).a), b |-> (\E b7807 \in ({1} \cap {1, 2}) : (<<1>> = [x \in 1..2 |-> x]))] EXCEPT !.a = Cardinality(((3 .. 2..1) \cap UNION {{x \in 1..3 : x > 1}, Nat}))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops .. in block line 14, col 167 to line 14, col 168 of module random_05018 and ...
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 170.
    | ExtendableExpr starting at line 14, column 165.
    | Expression starting at line 14, column 165.
    | ExtendableExpr starting at line 14, column 164.
    | Expression starting at line 14, column 164.
    | Fatal errors while parsing TLA+ spec in file random_05018
    | In module random_05018
    | Could not parse module random_05018 from file random_05018.tla
    | *** Errors: 1
    | In module random_05018
    | Could not parse module random_05018 from file random_05018.tla
    3002:1 Parsing or semantic analysis failed.
---*)
