(*---
description: Evaluates a random seq expression, seed 262, number 6834.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06834 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([SubSeq(Tail(<<3, 1, 2>>), (1 \div 3), CASE TRUE -> 0 [] OTHER -> 7) EXCEPT ![1] = (CASE TRUE -> <<3, 1, 2>> [] OTHER -> 2 + (-3))], (CASE (7 \in {1, 2}) -> ({2, 1, 3})[1] [] OTHER -> (2 \div 1) + (Len(<<3, 1, 2>>) % (3 \div -1))), Cardinality({b10470 \in ({1, 2} \ {1, 2}) : ([a |-> 1] = [a |-> 1])})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 243 to line 14, col 246 of module random_06834 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 241.
    | Expression starting at line 14, column 241.
    | ExtendableExpr starting at line 14, column 240.
    | ExtendableExpr starting at line 14, column 221.
    | Expression starting at line 14, column 221.
    | Fatal errors while parsing TLA+ spec in file random_06834
    | In module random_06834
    | Could not parse module random_06834 from file random_06834.tla
    | *** Errors: 1
    | In module random_06834
    | Could not parse module random_06834 from file random_06834.tla
    3002:1 Parsing or semantic analysis failed.
---*)
