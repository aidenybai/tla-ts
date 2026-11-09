// Ported from Z3 (src/model/seq_factory.h, src/model/char_factory.h), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import type { AstManager } from "./ast";
import { MAX_CHAR, mkConcatOf, mkSeqApp } from "./seq-decl-plugin";
import { OP_SEQ_TO_RE, OP_SEQ_UNIT } from "./ast";

interface ElementModel {
  getFreshValue(sort: number): number | null;
  getSomeValue(sort: number): number;
}

export const encodeZstring = (chars: readonly number[]) =>
  chars
    .map((char, index) =>
      char < 32 || char >= 127 || (char === 92 && chars[index + 1] === 117)
        ? `\\u{${char.toString(16)}}`
        : String.fromCharCode(char),
    )
    .join("");

export class CharFactory {
  private chars = new Set<number>();
  private next = 65;

  getSomeValue() {
    this.chars.add(97);
    return 97;
  }

  getFreshValue() {
    while (this.chars.has(this.next)) this.next++;
    if (this.next > MAX_CHAR) throw new SmtUnsupportedError("a model with more characters");
    this.chars.add(this.next);
    return this.next++;
  }

  registerValue(code: number) {
    this.chars.add(code);
  }
}

export class SeqFactory {
  private strings = new Set(["", "a", "b"]);
  private next = 0;
  private delimiter = "!";
  private uniqueSequences = new Map<number, number>();

  constructor(
    private manager: AstManager,
    private model: ElementModel,
  ) {}

  getFreshValue(sort: number): number {
    const manager = this.manager;
    if (manager.isStringSort(sort)) {
      for (;;) {
        const text = `${this.delimiter}${(this.next++).toString(16)}${this.delimiter}`;
        if (this.strings.has(text)) continue;
        this.strings.add(text);
        return manager.mkString([...text].map((char) => char.charCodeAt(0)));
      }
    }
    if (manager.isReSort(sort))
      return mkSeqApp(manager, OP_SEQ_TO_RE, [this.getFreshValue(manager.getReSeqSort(sort))]);
    if (manager.isCharSort(sort)) return manager.mkChar(97);
    const element = manager.getSeqElementSort(sort);
    const fresh = this.model.getFreshValue(element);
    if (fresh !== null) return mkSeqApp(manager, OP_SEQ_UNIT, [fresh]);
    const unit = mkSeqApp(manager, OP_SEQ_UNIT, [this.model.getSomeValue(element)]);
    const previous = this.uniqueSequences.get(sort);
    const unique = previous === undefined ? unit : mkConcatOf(manager, [unit, previous], sort);
    manager.incRef(unique);
    this.uniqueSequences.set(sort, unique);
    return unique;
  }

  registerValue(value: number) {
    const chars = this.manager.getString(value);
    if (chars === undefined) return;
    const text = encodeZstring(chars);
    this.strings.add(text);
    if (!text.includes(this.delimiter)) return;
    for (;;) {
      this.delimiter += "!";
      if (![...this.strings].some((other) => other.includes(this.delimiter))) return;
    }
  }
}
