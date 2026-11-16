(*---
description: Evaluates a random set expression, seed 262, number 7064.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07064 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b10850 == [[a |-> 1, b |-> TRUE] EXCEPT !.a = 1] IN ([a |-> 1]).a .. LET b10851 == CASE TRUE -> 1 [] OTHER -> 2 IN CASE FALSE -> 2147483647 [] OTHER -> b10851) \cap UNION {{(b10852 - {1, 2}) : b10852 \in (3 .. 2)}, {(--1), Len(<<>>)}}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 241 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 238.
    | Expression starting at line 14, column 238.
    | Some { } form starting at line 14, column 237.
    | ExtendableExpr starting at line 14, column 237.
    | Expression starting at line 14, column 237.
    | Fatal errors while parsing TLA+ spec in file random_07064
    | In module random_07064
    | Could not parse module random_07064 from file random_07064.tla
    | *** Errors: 1
    | In module random_07064
    | Could not parse module random_07064 from file random_07064.tla
    3002:1 Parsing or semantic analysis failed.
---*)
