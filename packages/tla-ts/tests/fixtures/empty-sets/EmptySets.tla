------------------------------ MODULE EmptySets ------------------------------
\* Assumptions ported from TLC's test-model/EmptySetEqCases.tla,
\* EmptySetEqAssume.tla, and ValueSemanticsCases.tla. TLC decides each one from
\* an empty domain, co-domain, field set, or component, without enumerating
\* the other arguments of the constructor.
EXTENDS FiniteSets, Integers, Sequences, TLC, TLCExt

\* Equality.
ASSUME { <<>> } = [{} -> Nat]
ASSUME [{} -> {"ref"}] = [1..0 -> Nat]
ASSUME [{} -> {"ref"}] = [[n1 : Nat, n2 : {}] -> {"d1"}]
ASSUME [{} -> {"ref"}] = [(STRING \X {}) -> {"d1"}]
ASSUME { <<>> } = [[Nat -> {}] -> {"d2"}]
ASSUME [{} -> {"ref"}] # [[{} -> {}] -> {"d2"}]
ASSUME { } = [(SUBSET Nat) -> {}]
ASSUME [{"ref"} -> {}] = [Seq({"d1"}) -> {}]
ASSUME [{"ref"} -> {}] = [{"d1"} -> [n1 : Nat, n2 : {}]]
ASSUME [ref : {}] = [n1 : Nat, n2 : {}]
ASSUME [ref : {}] = [n1 : {}, n2 : (Nat \ {0})]
ASSUME ({"ref"} \X {}) = (Seq({"d1"}) \X {})
ASSUME ({"ref"} \X {}) = ({} \X (Nat \ {0}))
ASSUME [Nat -> {}] = [n1 : {}]
ASSUME ({} \X {"r1"}) = [n1 : Nat, n2 : {}]
ASSUME [Nat -> {}] = { }
ASSUME [{} -> Nat] = [{} -> Int]
ASSUME [n1 : {"a"}] = [{"n1"} -> {"a"}]

\* Fingerprints.
ASSUME TLCFP([{} -> Nat]) = TLCFP({<<>>})
ASSUME TLCFP([n1 : {}, n2 : Nat]) = TLCFP({})
ASSUME TLCFP({[Nat -> {}], [n1 : {}], Nat \X {}}) = TLCFP({{}})

\* Cardinality.
ASSUME Cardinality([{} -> Nat]) = 1
ASSUME Cardinality([Nat -> {}]) = 0
ASSUME Cardinality([Nat -> {"d1"}]) = 1
ASSUME Cardinality([Nat -> SUBSET {}]) = 1
ASSUME Cardinality([[Nat -> {"d1"}] -> {"d2", "d3"}]) = 2
ASSUME Cardinality([((1..50000) \X (1..50000)) -> {"d1"}]) = 1
ASSUME Cardinality([n1 : 1..50000, n2 : 1..50000, n3 : {}]) = 0
ASSUME Cardinality([n1 : {}, n2 : Nat]) = 0
ASSUME Cardinality({} \X Nat) = 0
ASSUME Cardinality(SUBSET [(SUBSET (1..40)) -> {"d1"}]) = 2
ASSUME Cardinality([STRING -> {0}]) = 1
ASSUME Cardinality([Seq({}) -> {0}]) = 1

\* Finiteness.
ASSUME IsFiniteSet([{} -> STRING])
ASSUME IsFiniteSet([(Nat \ {0}) -> {}])
ASSUME IsFiniteSet([n1 : Nat, n2 : {}])
ASSUME IsFiniteSet((Nat \ {0}) \X {})
ASSUME IsFiniteSet([Int -> {"d1"}])
ASSUME IsFiniteSet(Seq({}))
ASSUME IsFiniteSet(SUBSET Seq({}))
ASSUME IsFiniteSet(Seq({}) \X {1})
ASSUME ~IsFiniteSet([Nat -> {1, 2}] \X {1})

\* Membership and subsets.
ASSUME <<>> \in [[n1 : {}, n2 : Nat] -> {"d1"}]
ASSUME <<>> \in [(Nat \X {}) -> {"d1"}]
ASSUME [{} -> Nat] \subseteq [{} -> {"d1"}]

\* What TLC refuses.
ASSUME AssertError("Attempted to enumerate a set of the form [D -> R],but the range R:\nNat\ncannot be enumerated.",
                   { } = [{"r1"} -> Nat])
ASSUME AssertError("Attempted to enumerate a set of the form [D -> R],but the domain D:\nNat\ncannot be enumerated.",
                   [x \in {"d1"} |-> "e1"] \notin [[Nat -> {"d1"}] -> {}])
ASSUME AssertError("Attempted to enumerate S \\ T when S:\nNat\nis not enumerable.",
                   [ref : {}] = [n1 : (Nat \ {0}), n2 : {}])
ASSUME AssertError("Attempted to enumerate a set of the form s1 \\X s2 ... \\X sn,\nbut can't enumerate s0:\nNat",
                   {} = Nat \X {"d1"})
ASSUME AssertError("Attempted to enumerate a set of the form [l1 : v1, ..., ln : vn],\nbut can't enumerate the value of the `n1' field:\nNat",
                   {} = [n1 : Nat])
ASSUME AssertError("Shouldn't call isEmpty() on value ANY",
                   [{"ref"} -> {}] = [Any -> {}])
ASSUME AssertError("Shouldn't call isEmpty() on value 1",
                   [1 -> {"a"}] = [1 -> {"a"}])
ASSUME AssertError("Attempted to compute cardinality of the value\nSeq({})",
                   Cardinality(Seq({})))
ASSUME AssertError("Attempted to enumerate S \\cup T when S:\n{0}\nand T:\nNat\nare not both enumerable",
                   Nat \cup {0} = Nat)
ASSUME AssertError("Attempted to enumerate { x \\in S : p(x) } when S:\nNat\nis not enumerable",
                   {x \in Nat : TRUE} = Nat)

VARIABLE unused
Init == unused = 0
Next == UNCHANGED unused
=============================================================================
