(*---
description: Evaluates a random set expression, seed 262, number 3642.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03642 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b5755 \in {b5756 \in DOMAIN [x \in 1..2 |-> x] : [FALSE EXCEPT !.a = b5754]} : LET b5757 == CASE FALSE -> 0 [] OTHER -> b5754 IN (b5755 * -1)) : b5754 \in DOMAIN [b5758 \in UNION {2..1, {}} |-> (2147483647 - [x \in Nat |-> x + 1])]})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 161 to line 14, col 161 of module random_03642 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 155.
    | Expression starting at line 14, column 155.
    | ExtendableExpr starting at line 14, column 154.
    | Expression starting at line 14, column 154.
    | Case Other Arm starting at line 14, column 104.
    | Fatal errors while parsing TLA+ spec in file random_03642
    | In module random_03642
    | Could not parse module random_03642 from file random_03642.tla
    | *** Errors: 1
    | In module random_03642
    | Could not parse module random_03642 from file random_03642.tla
    3002:1 Parsing or semantic analysis failed.
---*)
