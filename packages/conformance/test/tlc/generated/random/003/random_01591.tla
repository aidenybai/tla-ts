(*---
description: Evaluates a random set expression, seed 262, number 1591.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01591 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b2544 \in DOMAIN (2 :> b2543) : (~([a |-> 1, b |-> TRUE] = [a |-> 1]))) : b2543 \in (((TRUE \div -1) + IF TRUE THEN 3 ELSE TRUE) .. (Head(<<3, 1, 2>>) + (CHOOSE b2545 \in {x \in 1..3 : x > 1} : FALSE)))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 117 to line 14, col 120 of module random_01591 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 112.
    | Expression starting at line 14, column 112.
    | ExtendableExpr starting at line 14, column 111.
    | Expression starting at line 14, column 111.
    | ExtendableExpr starting at line 14, column 110.
    | Fatal errors while parsing TLA+ spec in file random_01591
    | In module random_01591
    | Could not parse module random_01591 from file random_01591.tla
    | *** Errors: 1
    | In module random_01591
    | Could not parse module random_01591 from file random_01591.tla
    3002:1 Parsing or semantic analysis failed.
---*)
