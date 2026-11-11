(*---
description: Evaluates a random int expression, seed 262, number 5811.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05811 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (({b8956 : b8956 \in 2..1} = (2 .. 3)) <=> (([a |-> 1] = [a |-> 1]) /\ (\E b8957 \in 1..3 : FALSE))) THEN Cardinality(((0 \div -1) .. (CHOOSE b8958 \in {2, 1, 3} : TRUE))) ELSE CASE ((TRUE => TRUE) /\ <<2147483647, 3>>) -> ((-7) - LET b8959 == 2 IN 7) [] OTHER -> (-(3 * 7)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 141 to line 14, col 144 of module random_05811 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 139.
    | Expression starting at line 14, column 139.
    | ExtendableExpr starting at line 14, column 138.
    | Expression starting at line 14, column 138.
    | ExtendableExpr starting at line 14, column 137.
    | Fatal errors while parsing TLA+ spec in file random_05811
    | In module random_05811
    | Could not parse module random_05811 from file random_05811.tla
    | *** Errors: 1
    | In module random_05811
    | Could not parse module random_05811 from file random_05811.tla
    3002:1 Parsing or semantic analysis failed.
---*)
