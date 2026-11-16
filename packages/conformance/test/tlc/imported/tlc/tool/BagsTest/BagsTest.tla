(*---
description: Ported from TLC's BagsTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/BagsTest.java
features:
  - tlc-regression
outcome: success
config: |-
  SPECIFICATION
  Spec
  CONSTANT
  C = C
args:
  - -deadlock
---*)
---------------------------- MODULE BagsTest ----------------------------
EXTENDS Bags, TLC, Integers

CONSTANT C

strings == {"a","b","c","d","e","f","g","h","i","j","k","l","m","n","o"}

s == {"a","b","c"}

a == <<>>
b == <<1,2,3>>
c == <<2,3,4>>
d == <<1,1,1>>
e == 1 :> 1
f == 2 :> 1
g == [x \in {1,2,3} |-> x * x]
h == [a |-> 3, b |-> 2, c |-> 1]

ASSUME(EmptyBag = <<>>)

\* IsABag
ASSUME(IsABag(a))
ASSUME(IsABag(b))
ASSUME(IsABag(c))
ASSUME(IsABag(d))
ASSUME(IsABag(e))
ASSUME(IsABag(f))
ASSUME(IsABag(g))
ASSUME(IsABag(h))

ASSUME(IsABag(SetToBag({})))

t == <<0>>
u == 2 :> -1
v == <<1,0>>
w == <<0,1>>
x == <<0,0,0>>
y == <<-1,-2,-3>>
z == <<"a","b","c">>

ASSUME(~IsABag(t))
ASSUME(~IsABag(u))
ASSUME(~IsABag(v))
ASSUME(~IsABag(w))
ASSUME(~IsABag(x))
ASSUME(~IsABag(y))
ASSUME(~IsABag(z)) \* With the standard module TLC fails with "Cannot decide if element "a" is element of Nat"

ASSUME(\A bool \in BOOLEAN : ~IsABag(bool))
ASSUME(~IsABag(C))  

\* BagCardinality
ASSUME(BagCardinality(a) = 0)
ASSUME(BagCardinality(b) = 6)
ASSUME(BagCardinality(c) = 9)
ASSUME(BagCardinality(d) = 3)
ASSUME(BagCardinality(e) = 1)
ASSUME(BagCardinality(f) = 1)
ASSUME(BagCardinality(g) = (1*1+2*2+3*3))
ASSUME(BagCardinality(h) = 6)

ASSUME(BagCardinality(<<1>>) = 1)
ASSUME(BagCardinality(<<1,3>>) = 4)

\* BagIn
ASSUME(\A elem \in 1..10: ~BagIn(elem, a))
ASSUME(\A elem \in 1..3: BagIn(elem, b))
ASSUME(\A elem \in 4..10: ~BagIn(elem, b))
ASSUME(\A dom \in DOMAIN c: BagIn(dom, c))
ASSUME(\A dom \in DOMAIN d: BagIn(dom, d))
ASSUME(\A dom \in DOMAIN e: BagIn(dom, e))
ASSUME(\A dom \in DOMAIN f: BagIn(dom, f))
ASSUME(\A dom \in DOMAIN f: BagIn(dom, f))
ASSUME(\A dom \in DOMAIN g: BagIn(dom, g))
ASSUME(\A dom \in DOMAIN h: BagIn(dom, h))
ASSUME(\A str \in (strings \ DOMAIN h): ~BagIn(str, h))
ASSUME(\A elem \in s : BagIn(elem, SetToBag(s)))


\* SetToBag and BagToSet
Codomain(fun) == {fun[i] : i \in DOMAIN fun}  
ASSUME(SetToBag(s) = [elem \in s |-> 1])
ASSUME(DOMAIN SetToBag(s) = s)
ASSUME(Codomain(SetToBag(s)) = {1})
ASSUME(BagToSet(SetToBag(s)) = s)

ASSUME(BagToSet(a) = {})
ASSUME(BagToSet(b) = DOMAIN b)
ASSUME(BagToSet(c) = DOMAIN c)
ASSUME(BagToSet(d) = DOMAIN d)
ASSUME(BagToSet(e) = {1})
ASSUME(BagToSet(f) = {2})
ASSUME(BagToSet(g) = DOMAIN g)
ASSUME(BagToSet(h) = s)


\* CopiesIn
ASSUME(\A str \in strings: CopiesIn(str, a) = 0)

ASSUME(\A dom \in DOMAIN b: CopiesIn(dom, b) = b[dom])
ASSUME(\A elem \in 5..10: CopiesIn(elem, b) = 0)
ASSUME(\A dom \in DOMAIN c: CopiesIn(dom, c) = c[dom])
ASSUME(\A elem \in 5..10: CopiesIn(elem, c) = 0)
ASSUME(\A dom \in DOMAIN d: CopiesIn(dom, d) = d[dom])
ASSUME(\A elem \in 5..10: CopiesIn(elem, d) = 0)

ASSUME(CopiesIn(1, e) = 1)
ASSUME(CopiesIn(2, f) = 1)
ASSUME(CopiesIn(1, f) = 0)
ASSUME(CopiesIn(1, 1 :> 0) = 0)
ASSUME(CopiesIn(2, 2 :> -1) = -1)

ASSUME(\A dom \in DOMAIN g: CopiesIn(dom, g) = dom * dom)

ASSUME(CopiesIn("a", h) = 3)
ASSUME(CopiesIn("b", h) = 2)
ASSUME(CopiesIn("c", h) = 1)
ASSUME(\A str \in (strings \ DOMAIN h): CopiesIn(str, h) = 0)

ASSUME(\A aelem \in s: CopiesIn(aelem, [elem \in s |-> 42]) = 42)
ASSUME(\A aelem \in s: CopiesIn(aelem, [elem \in s |-> 0]) = 0)


\* (+)
ASSUME(EmptyBag (+) EmptyBag = EmptyBag)
ASSUME(a (+) a = a)
ASSUME(b (+) b = <<2,4,6>>)
ASSUME(b (+) EmptyBag = b)
ASSUME(c (+) c = <<4,6,8>>)
ASSUME(d (+) d = <<2,2,2>>)
ASSUME(e (+) e = <<2>>)
ASSUME(b (+) c = c (+) b)
ASSUME(b (+) c = <<3,5,7>>)
ASSUME(h (+) h = [a |-> 6, b |-> 4, c |-> 2])
ASSUME([c |-> 3, d |-> 2, e |-> 1] (+) h = [a |-> 3, b |-> 2, c |-> 4, d |-> 2, e |-> 1])


\* (-)
ASSUME(a (-) a = a)
ASSUME(b (-) b = EmptyBag)
ASSUME(b (-) EmptyBag = b)
ASSUME(c (-) c = EmptyBag)
ASSUME(d (-) d = EmptyBag)
ASSUME(e (-) e = EmptyBag)
ASSUME(b (-) c = b (-) c)
ASSUME(b (-) c = EmptyBag)
ASSUME(c (-) b = <<1,1,1>>)
ASSUME([c |-> 3, d |-> 2, e |-> 1] (-) h = [c |-> 2, d |-> 2, e |-> 1])
ASSUME((1:>1) (-) EmptyBag = <<1>>)


\* BagUnion
ASSUME(BagUnion({a,a}) = a)
ASSUME(BagUnion({b,b}) = b)
ASSUME(BagUnion({c,c}) = c)
ASSUME(BagUnion({d,d}) = d)
ASSUME(BagUnion({e,e}) = e)
ASSUME(BagUnion({f,f}) = f)
ASSUME(BagUnion({g,g}) = g)
ASSUME(BagUnion({h,h}) = h)
ASSUME(BagUnion({h,h,[c |-> 3, d |-> 2, e |-> 1]}) = h (+) [c |-> 3, d |-> 2, e |-> 1])
ASSUME(BagUnion({a,b,c,d}) = <<4,6,8>>)
ASSUME(BagUnion({EmptyBag, EmptyBag}) = <<>>)
ASSUME(BagUnion({[a |-> 3, b |-> 2, c |-> 1],[c |-> 3, d |-> 2, e |-> 1]}) = [a |-> 3, b |-> 2, c |-> 4, d |-> 2, e |-> 1])
ASSUME(BagUnion({1 :> 2, 2 :> 2, 3 :> 3}) = (1 :> 2) (+) (2 :> 2) (+) (3 :> 3))
ASSUME(BagUnion({<<>>, <<1,1,1>>, <<1,2,3,4>>}) = (1:>2 @@ 2:>3 @@ 3:>4 @@ 4:>4))


\* \sqsubseteq
ASSUME((a \sqsubseteq a) = TRUE)
ASSUME((a \sqsubseteq b) = TRUE)
ASSUME((a \sqsubseteq c) = TRUE)
ASSUME((a \sqsubseteq d) = TRUE)
ASSUME((b \sqsubseteq b) = TRUE)
ASSUME((c \sqsubseteq c) = TRUE)
ASSUME((h \sqsubseteq [a |-> 3]) = FALSE)
ASSUME((h \sqsubseteq [a |-> 3, b |-> 2]) = FALSE)
ASSUME(([a |-> 3] \sqsubseteq h) = TRUE)
ASSUME(([a |-> 3, b |-> 2] \sqsubseteq h) = TRUE)
ASSUME(([a |-> 3, c |-> 1] \sqsubseteq h) = TRUE)
ASSUME(([b |-> 2, c |-> 1] \sqsubseteq h) = TRUE)
ASSUME((h \sqsubseteq h) = TRUE)


\* BagOfAll
ASSUME(BagOfAll(LAMBDA elem : elem, a) = a)
ASSUME(BagOfAll(LAMBDA elem : TRUE, a) = a)
ASSUME(BagOfAll(LAMBDA elem : elem, h) = h)
ASSUME(BagOfAll(LAMBDA elem : TRUE, h) = TRUE :> 6)
ASSUME(BagOfAll(LAMBDA elem : IF elem = "a" THEN "b" ELSE elem, [a |-> 3, b |-> 2, c |-> 1]) = [b |-> 5, c |-> 1])


\* SubBag
\* Module overwrite does not overwrite SubBag

\* A dummy spec to make TLC run model checking as required by BagsTest.java.
Spec == [][TRUE]_<<>>

=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    | line 31, col 7 to line 31, col 7 of module BagsTest
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 24, col 1 to line 24, col 9 of module BagsTest.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    | line 31, col 16 to line 31, col 16 of module BagsTest
    | The field name "b" in the record constructor is identical to the existing definition or declaration
    | named b, located at line 25, col 1 to line 25, col 14 of module BagsTest.
    | The field in the record will not take the value of the b definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [b |-> ...] = {"b"} holds true.
    | line 31, col 25 to line 31, col 25 of module BagsTest
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 26, col 1 to line 26, col 14 of module BagsTest.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 148, col 19 to line 148, col 19 of module BagsTest
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 24, col 1 to line 24, col 9 of module BagsTest.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    | line 148, col 28 to line 148, col 28 of module BagsTest
    | The field name "b" in the record constructor is identical to the existing definition or declaration
    | named b, located at line 25, col 1 to line 25, col 14 of module BagsTest.
    | The field in the record will not take the value of the b definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [b |-> ...] = {"b"} holds true.
    | line 148, col 37 to line 148, col 37 of module BagsTest
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 26, col 1 to line 26, col 14 of module BagsTest.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 149, col 9 to line 149, col 9 of module BagsTest
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 26, col 1 to line 26, col 14 of module BagsTest.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 149, col 18 to line 149, col 18 of module BagsTest
    | The field name "d" in the record constructor is identical to the existing definition or declaration
    | named d, located at line 27, col 1 to line 27, col 14 of module BagsTest.
    | The field in the record will not take the value of the d definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [d |-> ...] = {"d"} holds true.
    | line 149, col 27 to line 149, col 27 of module BagsTest
    | The field name "e" in the record constructor is identical to the existing definition or declaration
    | named e, located at line 28, col 1 to line 28, col 11 of module BagsTest.
    | The field in the record will not take the value of the e definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [e |-> ...] = {"e"} holds true.
    | line 149, col 45 to line 149, col 45 of module BagsTest
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 24, col 1 to line 24, col 9 of module BagsTest.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    | line 149, col 54 to line 149, col 54 of module BagsTest
    | The field name "b" in the record constructor is identical to the existing definition or declaration
    | named b, located at line 25, col 1 to line 25, col 14 of module BagsTest.
    | The field in the record will not take the value of the b definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [b |-> ...] = {"b"} holds true.
    | line 149, col 63 to line 149, col 63 of module BagsTest
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 26, col 1 to line 26, col 14 of module BagsTest.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 149, col 72 to line 149, col 72 of module BagsTest
    | The field name "d" in the record constructor is identical to the existing definition or declaration
    | named d, located at line 27, col 1 to line 27, col 14 of module BagsTest.
    | The field in the record will not take the value of the d definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [d |-> ...] = {"d"} holds true.
    | line 149, col 81 to line 149, col 81 of module BagsTest
    | The field name "e" in the record constructor is identical to the existing definition or declaration
    | named e, located at line 28, col 1 to line 28, col 11 of module BagsTest.
    | The field in the record will not take the value of the e definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [e |-> ...] = {"e"} holds true.
    | line 162, col 9 to line 162, col 9 of module BagsTest
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 26, col 1 to line 26, col 14 of module BagsTest.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 162, col 18 to line 162, col 18 of module BagsTest
    | The field name "d" in the record constructor is identical to the existing definition or declaration
    | named d, located at line 27, col 1 to line 27, col 14 of module BagsTest.
    | The field in the record will not take the value of the d definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [d |-> ...] = {"d"} holds true.
    | line 162, col 27 to line 162, col 27 of module BagsTest
    | The field name "e" in the record constructor is identical to the existing definition or declaration
    | named e, located at line 28, col 1 to line 28, col 11 of module BagsTest.
    | The field in the record will not take the value of the e definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [e |-> ...] = {"e"} holds true.
    | line 162, col 45 to line 162, col 45 of module BagsTest
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 26, col 1 to line 26, col 14 of module BagsTest.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 162, col 54 to line 162, col 54 of module BagsTest
    | The field name "d" in the record constructor is identical to the existing definition or declaration
    | named d, located at line 27, col 1 to line 27, col 14 of module BagsTest.
    | The field in the record will not take the value of the d definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [d |-> ...] = {"d"} holds true.
    | line 162, col 63 to line 162, col 63 of module BagsTest
    | The field name "e" in the record constructor is identical to the existing definition or declaration
    | named e, located at line 28, col 1 to line 28, col 11 of module BagsTest.
    | The field in the record will not take the value of the e definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [e |-> ...] = {"e"} holds true.
    | line 175, col 23 to line 175, col 23 of module BagsTest
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 26, col 1 to line 26, col 14 of module BagsTest.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 175, col 32 to line 175, col 32 of module BagsTest
    | The field name "d" in the record constructor is identical to the existing definition or declaration
    | named d, located at line 27, col 1 to line 27, col 14 of module BagsTest.
    | The field in the record will not take the value of the d definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [d |-> ...] = {"d"} holds true.
    | line 175, col 41 to line 175, col 41 of module BagsTest
    | The field name "e" in the record constructor is identical to the existing definition or declaration
    | named e, located at line 28, col 1 to line 28, col 11 of module BagsTest.
    | The field in the record will not take the value of the e definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [e |-> ...] = {"e"} holds true.
    | line 175, col 61 to line 175, col 61 of module BagsTest
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 26, col 1 to line 26, col 14 of module BagsTest.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 175, col 70 to line 175, col 70 of module BagsTest
    | The field name "d" in the record constructor is identical to the existing definition or declaration
    | named d, located at line 27, col 1 to line 27, col 14 of module BagsTest.
    | The field in the record will not take the value of the d definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [d |-> ...] = {"d"} holds true.
    | line 175, col 79 to line 175, col 79 of module BagsTest
    | The field name "e" in the record constructor is identical to the existing definition or declaration
    | named e, located at line 28, col 1 to line 28, col 11 of module BagsTest.
    | The field in the record will not take the value of the e definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [e |-> ...] = {"e"} holds true.
    | line 178, col 19 to line 178, col 19 of module BagsTest
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 24, col 1 to line 24, col 9 of module BagsTest.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    | line 178, col 28 to line 178, col 28 of module BagsTest
    | The field name "b" in the record constructor is identical to the existing definition or declaration
    | named b, located at line 25, col 1 to line 25, col 14 of module BagsTest.
    | The field in the record will not take the value of the b definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [b |-> ...] = {"b"} holds true.
    | line 178, col 37 to line 178, col 37 of module BagsTest
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 26, col 1 to line 26, col 14 of module BagsTest.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 178, col 47 to line 178, col 47 of module BagsTest
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 26, col 1 to line 26, col 14 of module BagsTest.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 178, col 56 to line 178, col 56 of module BagsTest
    | The field name "d" in the record constructor is identical to the existing definition or declaration
    | named d, located at line 27, col 1 to line 27, col 14 of module BagsTest.
    | The field in the record will not take the value of the d definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [d |-> ...] = {"d"} holds true.
    | line 178, col 65 to line 178, col 65 of module BagsTest
    | The field name "e" in the record constructor is identical to the existing definition or declaration
    | named e, located at line 28, col 1 to line 28, col 11 of module BagsTest.
    | The field in the record will not take the value of the e definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [e |-> ...] = {"e"} holds true.
    | line 178, col 79 to line 178, col 79 of module BagsTest
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 24, col 1 to line 24, col 9 of module BagsTest.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    | line 178, col 88 to line 178, col 88 of module BagsTest
    | The field name "b" in the record constructor is identical to the existing definition or declaration
    | named b, located at line 25, col 1 to line 25, col 14 of module BagsTest.
    | The field in the record will not take the value of the b definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [b |-> ...] = {"b"} holds true.
    | line 178, col 97 to line 178, col 97 of module BagsTest
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 26, col 1 to line 26, col 14 of module BagsTest.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 178, col 106 to line 178, col 106 of module BagsTest
    | The field name "d" in the record constructor is identical to the existing definition or declaration
    | named d, located at line 27, col 1 to line 27, col 14 of module BagsTest.
    | The field in the record will not take the value of the d definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [d |-> ...] = {"d"} holds true.
    | line 178, col 115 to line 178, col 115 of module BagsTest
    | The field name "e" in the record constructor is identical to the existing definition or declaration
    | named e, located at line 28, col 1 to line 28, col 11 of module BagsTest.
    | The field in the record will not take the value of the e definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [e |-> ...] = {"e"} holds true.
    | line 190, col 24 to line 190, col 24 of module BagsTest
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 24, col 1 to line 24, col 9 of module BagsTest.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    | line 192, col 10 to line 192, col 10 of module BagsTest
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 24, col 1 to line 24, col 9 of module BagsTest.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    | line 194, col 10 to line 194, col 10 of module BagsTest
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 24, col 1 to line 24, col 9 of module BagsTest.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    | line 194, col 19 to line 194, col 19 of module BagsTest
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 26, col 1 to line 26, col 14 of module BagsTest.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 195, col 10 to line 195, col 10 of module BagsTest
    | The field name "b" in the record constructor is identical to the existing definition or declaration
    | named b, located at line 25, col 1 to line 25, col 14 of module BagsTest.
    | The field in the record will not take the value of the b definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [b |-> ...] = {"b"} holds true.
    | line 195, col 19 to line 195, col 19 of module BagsTest
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 26, col 1 to line 26, col 14 of module BagsTest.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 204, col 66 to line 204, col 66 of module BagsTest
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 24, col 1 to line 24, col 9 of module BagsTest.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    | line 204, col 75 to line 204, col 75 of module BagsTest
    | The field name "b" in the record constructor is identical to the existing definition or declaration
    | named b, located at line 25, col 1 to line 25, col 14 of module BagsTest.
    | The field in the record will not take the value of the b definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [b |-> ...] = {"b"} holds true.
    | line 204, col 84 to line 204, col 84 of module BagsTest
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 26, col 1 to line 26, col 14 of module BagsTest.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    | line 204, col 97 to line 204, col 97 of module BagsTest
    | The field name "b" in the record constructor is identical to the existing definition or declaration
    | named b, located at line 25, col 1 to line 25, col 14 of module BagsTest.
    | The field in the record will not take the value of the b definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [b |-> ...] = {"b"} holds true.
    | line 204, col 106 to line 204, col 106 of module BagsTest
    | The field name "c" in the record constructor is identical to the existing definition or declaration
    | named c, located at line 26, col 1 to line 26, col 14 of module BagsTest.
    | The field in the record will not take the value of the c definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [c |-> ...] = {"c"} holds true.
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
