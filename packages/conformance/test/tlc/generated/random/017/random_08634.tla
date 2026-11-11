(*---
description: Evaluates a random record expression, seed 262, number 8634.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08634 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CASE (1 \o <<3, 1, 2>>) -> ([a |-> 1, b |-> TRUE]).a [] OTHER -> (3 \div -1) % (IF TRUE THEN 3 ELSE 2 % (<<>> + 2147483647))), b |-> (((CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE) @@ [[x \in 1..2 |-> x] EXCEPT ![2147483647] = 1]) => ((2147483647 .. 1) \subseteq {b13369 : b13369 \in 1..3}))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 92 to line 14, col 95 of module random_08634 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 90.
    | Expression starting at line 14, column 90.
    | ExtendableExpr starting at line 14, column 89.
    | Expression starting at line 14, column 89.
    | Case Other Arm starting at line 14, column 80.
    | Fatal errors while parsing TLA+ spec in file random_08634
    | In module random_08634
    | Could not parse module random_08634 from file random_08634.tla
    | *** Errors: 1
    | In module random_08634
    | Could not parse module random_08634 from file random_08634.tla
    3002:1 Parsing or semantic analysis failed.
---*)
