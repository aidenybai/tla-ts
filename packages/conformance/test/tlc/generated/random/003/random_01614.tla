(*---
description: Evaluates a random function expression, seed 262, number 1614.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01614 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b2573 \in (IF TRUE THEN 2 ELSE 0 .. CASE TRUE -> 0 [] OTHER -> -1) : (SelectSeq(<<1>>, LAMBDA e : e > 0) = Cardinality({}))) :> ([(2147483647 :> <<1>>) EXCEPT ![(-1 \div -1)] = (2147483647 + -1)])[LET b2574 == (7 \div -1) IN (2147483647 \div b2574)]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 190 to line 14, col 193 of module random_01614 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 188.
    | Expression starting at line 14, column 187.
    | ExtendableExpr starting at line 14, column 186.
    | Expression starting at line 14, column 186.
    | Except Component starting at line 14, column 185.
    | Fatal errors while parsing TLA+ spec in file random_01614
    | In module random_01614
    | Could not parse module random_01614 from file random_01614.tla
    | *** Errors: 1
    | In module random_01614
    | Could not parse module random_01614 from file random_01614.tla
    3002:1 Parsing or semantic analysis failed.
---*)
