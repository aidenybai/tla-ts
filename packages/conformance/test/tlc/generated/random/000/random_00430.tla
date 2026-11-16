(*---
description: Evaluates a random bool expression, seed 262, number 430.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00430 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b701 == Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) IN ([b702 \in {1} |-> 2147483647])[(7 - -1)], b |-> ((CHOOSE b703 \in ({1, 2} \cap {}) : ([a |-> 1] = [a |-> 1, b |-> TRUE])) \in {(2147483647 \div -1), IF [a |-> 1] THEN 2 ELSE 2})])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 221 to line 14, col 224 of module random_00430 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 210.
    | Expression starting at line 14, column 210.
    | ExtendableExpr starting at line 14, column 209.
    | Expression starting at line 14, column 209.
    | Some { } form starting at line 14, column 208.
    | Fatal errors while parsing TLA+ spec in file random_00430
    | In module random_00430
    | Could not parse module random_00430 from file random_00430.tla
    | *** Errors: 1
    | In module random_00430
    | Could not parse module random_00430 from file random_00430.tla
    3002:1 Parsing or semantic analysis failed.
---*)
