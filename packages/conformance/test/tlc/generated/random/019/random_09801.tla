(*---
description: Evaluates a random record expression, seed 262, number 9801.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09801 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE b15206 \in ({2, 1, 3} \ {1, 2}) : (TRUE <=> FALSE)) .. LET b15207 == ([a |-> 1, b |-> TRUE] - -1) IN (--1)) EXCEPT !.a = @ + Head(SubSeq(<<3, -1>>, Cardinality({1}), [a |-> TRUE, b |-> FALSE]))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 130 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 127.
    | Expression starting at line 14, column 127.
    | Case Other Arm starting at line 14, column 81.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_09801
    | In module random_09801
    | Could not parse module random_09801 from file random_09801.tla
    | *** Errors: 1
    | In module random_09801
    | Could not parse module random_09801 from file random_09801.tla
    3002:1 Parsing or semantic analysis failed.
---*)
