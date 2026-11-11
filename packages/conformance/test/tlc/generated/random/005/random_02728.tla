(*---
description: Evaluates a random function expression, seed 262, number 2728.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02728 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4304 \in UNION {(DOMAIN [x \in 1..2 |-> x] \ ({} \cup {1})), ((2 * -1) .. ([x \in 1..2 |-> x])[2147483647])} |-> (((2147483647 + b4304) * (b4304 + -1)) - CASE (FALSE => FALSE) -> LET b4305 == <<1, 2>> IN 1 [] OTHER -> IF FALSE THEN b4304 ELSE 3)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 83 to line 14, col 83 of module random_02728 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 81.
    | Expression starting at line 14, column 81.
    | ExtendableExpr starting at line 14, column 80.
    | Expression starting at line 14, column 80.
    | ExtendableExpr starting at line 14, column 79.
    | Fatal errors while parsing TLA+ spec in file random_02728
    | In module random_02728
    | Could not parse module random_02728 from file random_02728.tla
    | *** Errors: 1
    | In module random_02728
    | Could not parse module random_02728 from file random_02728.tla
    3002:1 Parsing or semantic analysis failed.
---*)
