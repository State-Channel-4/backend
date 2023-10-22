import { URLDocument } from "../models/schema";
export const shuffle = (array: URLDocument[]): URLDocument[] => {
  let currentIndex = array.length;
  let temporaryValue: URLDocument;
  let randomIndex: number;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
};