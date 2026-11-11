(*---
description: Evaluates a random function expression, seed 262, number 602.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00602 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1008 \in (CASE (7 \/ TRUE) -> (CHOOSE b1009 \in {1, 2} : TRUE) [] OTHER -> (2 \div -1) .. Cardinality({b1010 \in {} : TRUE})) |-> ([[a |-> 2147483647, b |-> TRUE] EXCEPT !.a = CASE FALSE -> 3 [] OTHER -> 2])[(Len(<<1>>) + Cardinality({}))]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 96 to line 14, col 99 of module random_00602 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 94.
    | Expression starting at line 14, column 94.
    | ExtendableExpr starting at line 14, column 93.
    | Expression starting at line 14, column 93.
    | Case Other Arm starting at line 14, column 84.
    | Fatal errors while parsing TLA+ spec in file random_00602
    | In module random_00602
    | Could not parse module random_00602 from file random_00602.tla
    | *** Errors: 1
    | In module random_00602
    | Could not parse module random_00602 from file random_00602.tla
    3002:1 Parsing or semantic analysis failed.
---*)
