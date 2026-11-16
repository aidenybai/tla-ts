(*---
description: Evaluates a random int expression, seed 262, number 1816.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01816 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b2879 == CASE (\E b2880 \in ({x \in 1..3 : x > 1} \cap {2, 1, 3}) : (b2880 \in SUBSET {1})) -> ((CHOOSE f \in [{} -> 1..2] : TRUE))[Cardinality(Nat)] [] OTHER -> ((2 \div 7) + (--1)) IN Cardinality(({b2881 \in SUBSET {1} : TRUE} .. Cardinality({1}))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 199 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 196.
    | ExtendableExpr starting at line 14, column 183.
    | Expression starting at line 14, column 183.
    | ExtendableExpr starting at line 14, column 182.
    | Expression starting at line 14, column 182.
    | Fatal errors while parsing TLA+ spec in file random_01816
    | In module random_01816
    | Could not parse module random_01816 from file random_01816.tla
    | *** Errors: 1
    | In module random_01816
    | Could not parse module random_01816 from file random_01816.tla
    3002:1 Parsing or semantic analysis failed.
---*)
