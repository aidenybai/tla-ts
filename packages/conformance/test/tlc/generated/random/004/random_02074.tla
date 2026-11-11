(*---
description: Evaluates a random seq expression, seed 262, number 2074.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02074 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(SelectSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0), ((2147483647 :> 0))[Cardinality({2, 1, 3})], (-CASE TRUE -> 2 [] OTHER -> 1)), (((7 \div 2147483647) \div (3 \div -1)) \div Len((<<1, 2>> \o <<1, 2>>)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 208 to line 14, col 211 of module random_02074 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 206.
    | Expression starting at line 14, column 206.
    | ExtendableExpr starting at line 14, column 205.
    | ExtendableExpr starting at line 14, column 180.
    | Expression starting at line 14, column 180.
    | Fatal errors while parsing TLA+ spec in file random_02074
    | In module random_02074
    | Could not parse module random_02074 from file random_02074.tla
    | *** Errors: 1
    | In module random_02074
    | Could not parse module random_02074 from file random_02074.tla
    3002:1 Parsing or semantic analysis failed.
---*)
