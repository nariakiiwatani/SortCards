import "normalize.css"
import "../styles/index.scss";
import Sortable from "sortablejs";

export function cloneNode<T extends Node>(node: T, deep: boolean) {
    return <T>node.cloneNode(deep);
}

class Editor {
	list: HTMLElement;
	template: HTMLElement;
	constructor(parent: HTMLElement, callback: (result:number, success?:()=>void, failure?:(reason: string)=>void) => void) {
		const list: HTMLElement = parent.querySelector(".cards");
		const info: HTMLElement = parent.querySelector(".result");

		Sortable.create(list, {
			animation: 300
		});

		const getResult = ((list: HTMLElement) => {
			return () => {
				let ret: number = 0;
				Array.from(list.children).forEach((card: HTMLElement) => {
					ret = 10*ret + parseInt(card.textContent);
				});
				return ret;
			};
		})(list);
		const sortItems = ((list: HTMLElement) =>  {
			return () => {
				Array.from(list.children).sort(function(a, b){
					return a.textContent.localeCompare(b.textContent);
				}).forEach((card: HTMLElement)=> {
					list.appendChild(list.removeChild(card));
				});
			};
		})(list);
		parent.querySelector(".submit").addEventListener("click", ()=> {
			callback(getResult(),
			()=> {
				info.className = "success";
				info.textContent = "成功";
			},
			(reason: string)=> {
				info.className = "error";
				info.textContent = "失敗: " + reason;
			});
		});

		parent.querySelector(".reset").addEventListener("click", ()=> {
			sortItems();
		});

		this.list = list;
		this.template = parent.querySelector(".template *");
	}
	createCards(num: number):void {
		this.list.textContent = "";
		for(let i:number = 1; i <= num; ++i) {
			const card = cloneNode(this.template, true);
			card.textContent = String(i%10);
			this.list.appendChild(card);
		}
	}
}

class Results {
	results: number[] = [];
	count: HTMLElement;
	list: HTMLElement;
	result_template: HTMLElement;
	digits: number;
	constructor(parent: HTMLElement) {
		this.list = parent.querySelector(".list");
		this.count = parent.querySelector(".count");
		this.result_template = parent.querySelector(".template *");
		Sortable.create(this.list, {
			animation: 300
		});
		const clear_button = parent.querySelector(".clear");
		if(clear_button) clear_button.addEventListener("click", ()=> {
			this.clear();
		});
	}
	add(result: number): boolean {
		let ret: boolean = true;
		let index: number = 0;
		this.results.forEach((value: number) => {
			if(result === value) {
				ret = false;
			}
			else if(result > value) {
				++index;
			}
		});
		if(ret) {
			this.results.splice(index, 0, result);
			const node = cloneNode(this.result_template, true);
			node.textContent = String(result);
			this.list.insertBefore(node, this.list.children[index]);
			this.count.textContent = String(this.results.length);
		}
		return ret;
	}
	addArray(new_values: number[], sort: boolean) {
		this.results = Array.from(new_values);
		if(sort) this.results.sort();
		const fragment = document.createDocumentFragment();
		this.results.forEach((value) => {
			const node = cloneNode(this.result_template, true);
			node.textContent = String(value);
			fragment.appendChild(node);
		});
		this.list.appendChild(fragment);
		this.count.textContent = String(this.results.length);
	}
	refresh(new_values: number[], sort: boolean): void {
		this.clear();
		this.addArray(new_values, sort);
	}
	clear(): void {
		this.results = [];
		this.list.textContent = "";
	}
	getAllResults() {
		const cards: number[] = [];
		for(let i = 1; i <= this.digits; ++i) {
			cards.push(i%10);
		}

		const takeAll = (cards: number[], is_first_rank: boolean) => {
			return cards.reduce((results: number[], card: number, index: number, array: number[]) => {
				if(is_first_rank && (card === 0)) return results;
				const rest_cards = Array.from(array);
				rest_cards.splice(index,1);
				const rank = Math.pow(10, rest_cards.length);
				if(rest_cards.length > 0) {
					return results.concat(takeAll(rest_cards, false).map(v=>card*rank+v));
				}
				else {
					return [card];
				}
			}, []);
		};
		return takeAll(cards, true);
	}
	setDigits(digits: number): void {
		this.digits = digits;
		const fact = n => (n===0) ? 1 : (n*fact(n-1));
		this.list.style.height = `calc((2rem + 12px)*${fact(digits)/digits})`;
	}
}
(()=>{
	const results = new Results(document.querySelector("#statistics"));
	const answer = new Results(document.querySelector("#answer"));
	const editor = new Editor(document.querySelector("#editor"),
		(result: number, success: ()=>void, failure: (reason: string)=>void) => {
			if(results.add(result)) {
				success();
			}
			else {
				failure("もう作った組み合わせでした");
			}
		}
	);
	const initGame = (num: number) => {
		results.clear();
		editor.createCards(num);
		results.setDigits(num);
		answer.setDigits(num);
		answer.refresh(answer.getAllResults(), false);
	}
	const digit = 4;
	initGame(digit);
})();