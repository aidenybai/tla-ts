(*---
description: Evaluates a random bool expression, seed 262, number 8587.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08587 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({([b13302 \in TRUE |-> b13302])[(b13301 + 2147483647)] : b13301 \in ({1 : b13303 \in 2..1} \cap (SUBSET {1} \cap {1, 2}))} = (LET b13304 == [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2..1] IN (--1) .. (Len(<<1, 2>>) - ((1 :> 2))[-1]))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 205 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 202.
    | Expression starting at line 14, column 202.
    | Case Other Arm starting at line 14, column 143.
    | Expression starting at line 14, column 143.
    | ExtendableExpr starting at line 14, column 142.
    | Fatal errors while parsing TLA+ spec in file random_08587
    | In module random_08587
    | Could not parse module random_08587 from file random_08587.tla
    | *** Errors: 1
    | In module random_08587
    | Could not parse module random_08587 from file random_08587.tla
    3002:1 Parsing or semantic analysis failed.
---*)
